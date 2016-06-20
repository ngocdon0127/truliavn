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

var processingCity = 1 // Hà Nội
// var processingDistrict = 11 // Hai Bà Trưng
// var processingDistrict = 1 // Ba Đình
// var processingDistrict = 3 // Bắc Từ Liêm
// var processingDistrict = 2 // Ba Vì
// var processingDistrict = 4 // Cầu Giấy
// var processingDistrict = 5 // Chương Mỹ
// var processingDistrict = 6
var processingDistrict = process.env.pd

// error 8, 13, (17), (19)
// checking 12

var data = []

var interval = setInterval(function () {
	if (stt >= 3){
		clearInterval(interval);
		crawlUrls();
		stt = 0;
	}
}, 1000);

var right = 0;
var wrong = 0;
var rightUrls = [];
var wrontUrls = [];

function crawlUrls () {
	for (var i in WARDS){
		var ward = WARDS[i];
		if (ward.districtId == processingDistrict){
			var house = {};
			house.city = processingCity;
			house.district = processingDistrict;
			house.ward = i;
			house.url = "http://batdongsan.com.vn/cho-thue-nha-rieng-phuong-" + ward.wardName.vi2en().replace(/ {2,}/g, ' ').replace(/ /g, '-');
			console.log(house.url);
			data.push(house);

			// clone object
			// house = Object.assign({}, house); // can use Object.clone(house)
			house = JSON.parse(JSON.stringify(house));
			house.url = "http://batdongsan.com.vn/cho-thue-nha-rieng-xa-" + ward.wardName.vi2en().replace(/ {2,}/g, ' ').replace(/ /g, '-');
			console.log(house.url);
			data.push(house);
		}
	}
	// console.log(data);
	connection.end();

	// start crawling

	var interval = setInterval(function () {
		if (stt >= data.length){
			console.log(right + ":" + wrong);
			console.log(rightUrls);
			console.log(wrontUrls);
			clearInterval(interval);
			// console.log(data);
			var houses = [];
			// console.log(data.length);
			for (var index = 0; index < data.length; index++){
				var housesInWard = data[index];
				var urls = housesInWard.urls;
				// console.log("urls: " + urls.length);
				if (urls.length > 0){
					// console.log(index);
					// console.log(data[index]);
				}
				for (var i = 0; i < urls.length; i++) {
					var house = {};
					house.city = housesInWard.city;
					house.district = housesInWard.district;
					house.ward = housesInWard.ward;
					house.url = urls[i];
					houses.push(house);
				}
			}
			// console.log(houses);
			fs.writeFileSync('houses.json', JSON.stringify(houses, null, 4));
		}
		console.log(stt + "/" + data.length);
	}, 1000);

	for (var i = 0; i < data.length; i++) {
		var house = data[i];
		house.urls = [];
		// console.log('------------');
		// console.log(house.url);
		// console.log('------------');
		var options = {
			url: house.url,
			headers:{
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.84 Safari/537.36'
			}
		}

		/**
		 * ------------------------
		 * This code will not work.
		 * ------------------------
		 *
		 * Damn it, can't write those comments in English.
		 * 
		 * Mỗi lần vòng for chạy, biến house nhận từng giá trị data[i]
		 * Thời điểm request gọi callback, biến house nhận giá trị data[data.length - 1]
		 * => Do đó, mọi crawled url sẽ được đẩy hết vào data[data.length - 1]
		 */

		/**
		request(options, function (err, response, body) {
			if (!err && response.statusCode == 200){
				var $ = cheerio.load(body);
				var items = $('.search-productItem');
				for (var j = 0; j < items.length; j++) {
					var houseUrl = $(items[j]).children('.p-title').children('a')[0].attribs.href;
					house.urls.push(houseUrl);
				}
				stt++;
			}
		})
		
		/**
		 * ------------------------
		 * Neither does this.
		 * ------------------------
		 *
		 * request gọi callback chính là hàm cb, truyền err vào house
		 * return function không có tác dụng gì.
		 * biến stt không tăng
		 * => Lặp vô hạn
		 */

		/**
		request(options, function cb(house) {
			var h = house;
			console.log('part');
			return function (err, response, body) {
				console.log('call cb');
				if (!err && response.statusCode == 200){
					var $ = cheerio.load(body);
					var items = $('.search-productItem');
					for (var j = 0; j < items.length; j++) {
						var houseUrl = $(items[j]).children('.p-title').children('a')[0].attribs.href;
						h.urls.push(houseUrl);
					}
					console.log(stt);
					stt++;
				}
			}
		})

		*/

		/**
		 * ------------------------
		 * Only this would work.
		 * nice trick.
		 * ------------------------
		 *
		 * Mỗi lần invoke cb(house) trả về 1 function (err, response, body).
		 * function này có thể truy cập được biến house (thông qua biến h) tại thời điểm cb được invoke (chính là biến data[i] tại mỗi vòng lặp) => Good.
		 */

		function cb(h, originalUrl) {

			// house (data[i]) is passed to h

			return function (err, response, body) {
				// console.log('call cb');
				if (!err && response.statusCode == 200){
					if (originalUrl != response.request.uri.href){
						// console.log("=======================")
						// console.log(originalUrl);
						// console.log(response.request.uri.href);
						// console.log("=======================");
						wrontUrls.push({origin: originalUrl, red: response.request.uri.href});
						wrong++;
						stt++;
						return;
					}
					// console.log("+++++++++++++++++");
					// console.log(originalUrl);
					// console.log("+++++++++++++++++");
					right++;
					rightUrls.push(originalUrl);
					var $ = cheerio.load(body);
					var items = $('.search-productItem');
					// console.log('items: ' + items.length);
					for (var j = 0; j < items.length; j++) {
						var houseUrl = $(items[j]).children('.p-title').children('a')[0].attribs.href;
						// console.log('houseUrl: ' + houseUrl);

						// use h here.
						h.urls.push(houseUrl);
					}
					// console.log(stt);
					stt++;
				}
			}
		}
		request(options, cb(house, options.url));

	}
}