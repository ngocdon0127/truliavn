var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var mysql = require('mysql');

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'truliavn'
})

String.prototype.myTrim = function() {
	var s = this.trim();
	s = s.replace(/\r+\n+/g, ' ');
	s = s.replace(/ {2,}/g, ' ');
	return s;
}

String.prototype.vi2en = function() {
	var str = this.myTrim();
	str= str.toLowerCase(); 
	str= str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a"); 
	str= str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e"); 
	str= str.replace(/ì|í|ị|ỉ|ĩ/g, "i"); 
	str= str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o"); 
	str= str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u"); 
	str= str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y"); 
	str= str.replace(/đ/g, "d"); 
	return str;
}

var CITIES = {};
var DISTRICTS = {};
var WARDS = {};
var stt = 0;

// city
connection.query(
	'SELECT * FROM Cities',
	[],
	function (err, cities, fields) {
		if (err){
			console.log(err);
			return;
		}
		for (var i = 0; i < cities.length; i++) {
			CITIES[cities[i].id] = {cityName: cities[i].cityName};
		}
		stt++;
		console.log('city ok.');
	}
)

// district
connection.query(
	'SELECT * FROM Districts',
	[],
	function (err, districts, fields) {
		if (err){
			console.log(err);
			return;
		}
		for (var i = 0; i < districts.length; i++) {
			DISTRICTS[districts[i].id] = {
				cityId: districts[i].cityId, 
				districtName: districts[i].districtName
			}
		}
		stt++;
		console.log('district ok.');
	}
)

// ward
connection.query(
	'SELECT * FROM Wards',
	[],
	function (err, wards, fields) {
		if (err){
			console.log(err);
			return;
		}
		for (var i = 0; i < wards.length; i++) {
			WARDS[wards[i].id] = {
				districtId: wards[i].districtId,
				wardName: wards[i].wardName
			}
		}
		stt++;
		console.log('ward ok.');
	}
)

var interval = setInterval(function () {
	if (stt >= 3){
		clearInterval(interval);
		crawlUrls();
		fs.writeFileSync('batdongsan.json', JSON.stringify({
			cities: CITIES,
			districts: DISTRICTS,
			wards: WARDS
		}, null, 4));
		stt = 0;
		connection.end();
	}
}, 1000);

var data = {}
var districtsLen = 0;
var districtsDone = 0;
var wardsLen = 0;
var wardsDone = 0;

var HOUSE_FOR_RENT = 0;
var HOUSE_FOR_SELL = 1;
var HOUSE_FOR = HOUSE_FOR_RENT

var HOUSE_TYPE_CHUNG_CU = 0;
var HOUSE_TYPE_NHA_RIENG = 1;
var HOUSE_TYPE = HOUSE_TYPE_NHA_RIENG

var cboTypeRe = [[326, 52], [324, 41]];

var bdsRedirectHandler = 'http://batdongsan.com.vn/HandlerWeb/redirect.ashx?IsMainSearch=true';

function crawlUrls () {
	data = JSON.parse(fs.readFileSync('batdongsan1.json'));

	// district
	var districts = data.districts;
	districtsLen = Object.keys(districts).length;

	var interval = setInterval(function () {
		if ((districtsLen <= districtsDone) && (wardsLen <= wardsDone)){
			clearInterval(interval);
			fs.writeFileSync('batdongsan1.json', JSON.stringify(data, null, 4));
		}
	})

	for (var i in districts) {
		// console.log(districts[i]);
		request.post(
			bdsRedirectHandler, 
			{
				form: {
					'cboCity': "HN",

					// cboCategory is not important
					// cboCategory: (HOUSE_FOR === HOUSE_FOR_RENT) ? 49 : 38,
					// cboCategory: 49, // thue
					// cboCategory: 38, // ban
					cboTypeRe: cboTypeRe[HOUSE_FOR][HOUSE_TYPE],
					// cboTypeRe: 52, // nha rieng
					// cboTypeRe: 326, // chung cu
					cboDistrict: districts[i].bdsDistrictId,
					// cboWard: data.wards[841].bdsWardId,
					cboWard: 0,
					cboArea: -1,
					cboPrice: -1,
					cboBedRoom: -1,
					cboHomeDirection: -1
				}
			}, 
			createCallback({district: districts[i]}, 'district')
		);
	}

	// ward
	var wards = data.wards;
	wardsLen = Object.keys(wards).length;
	for (var i in wards) {
		request.post(
			'http://batdongsan.com.vn/HandlerWeb/redirect.ashx?IsMainSearch=true', 
			{
				form: {
					'cboCity': "HN",
					cboTypeRe: cboTypeRe[HOUSE_FOR][HOUSE_TYPE],
					// cboCategory: (HOUSE_FOR === HOUSE_FOR_RENT) ? 49 : 38,
					// cboCategory: 49, // thue
					// cboCategory: 38, // ban
					// cboTypeRe: (HOUSE_TYPE === HOUSE_TYPE_NHA_RIENG) ? 52 : 326,
					// cboTypeRe: 52, // nha rieng
					// cboTypeRe: 326, // chung cu
					cboDistrict: wards[i].districtId,
					cboWard: wards[i].bdsWardId,
					cboArea: -1,
					cboPrice: -1,
					cboBedRoom: -1,
					cboHomeDirection: -1
				}
			}, 
			createCallback({ward: wards[i]}, 'ward')
		);
	}
}

function createCallback (shareData, type) {
	switch (type){
		case 'district':
			return function (err, response, body) {
				// console.log('callback');
				var district = shareData.district;
				if (err){
					console.log(err);
				}
				// console.log(response.statusCode); // 302 redirect
				else {
					district.bdsDistrictUrl = response.headers.location;
					district.type = HOUSE_TYPE;
					district.houseFor = HOUSE_FOR;
					// console.log(response.headers.location);
				}
				districtsDone++;
				console.log('district: ' + districtsDone + "/" + districtsLen);
			}
		case 'ward':
			return function (err, response, body) {
				var ward = shareData.ward;
				if (err){
					console.log(err);
				}
				else {
					ward.bdsWardUrl = response.headers.location;
					ward.type = HOUSE_TYPE;
					ward.houseFor = HOUSE_FOR;
				}
				wardsDone++;
				console.log('ward: ' + wardsDone + "/" + wardsLen);
			}
		default:
			return function (err, response, body) {
				console.log('invalid type of callback parameter');
			}
	}
}