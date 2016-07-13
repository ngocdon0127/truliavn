var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var mysql = require('mysql');

var connection = require('./database.js').MYSQL();

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

// console.log("\n======================================");
// console.log("======== " + process.env.pd + " ========");
// console.log("======================================\n");

// var CITIES = {};
// var DISTRICTS = {};
// var WARDS = {};
var stt = 0;

// city
// connection.query(
// 	'SELECT * FROM Cities',
// 	[],
// 	function (err, cities, fields) {
// 		if (err){
// 			console.log(err);
// 			return;
// 		}
// 		for (var i = 0; i < cities.length; i++) {
// 			CITIES[cities[i].id] = {cityName: cities[i].cityName};
// 		}
// 		stt++;
// 		console.log('city ok.');
// 	}
// )

// // district
// connection.query(
// 	'SELECT * FROM Districts',
// 	[],
// 	function (err, districts, fields) {
// 		if (err){
// 			console.log(err);
// 			return;
// 		}
// 		for (var i = 0; i < districts.length; i++) {
// 			DISTRICTS[districts[i].id] = {
// 				cityId: districts[i].cityId, 
// 				districtName: districts[i].districtName
// 			}
// 		}
// 		stt++;
// 		console.log('district ok.');
// 	}
// )

// // ward
// connection.query(
// 	'SELECT * FROM Wards',
// 	[],
// 	function (err, wards, fields) {
// 		if (err){
// 			console.log(err);
// 			return;
// 		}
// 		for (var i = 0; i < wards.length; i++) {
// 			WARDS[wards[i].id] = {
// 				districtId: wards[i].districtId,
// 				wardName: wards[i].wardName
// 			}
// 		}
// 		stt++;
// 		console.log('ward ok.');
// 	}
// )

var places = JSON.parse(fs.readFileSync('batdongsan1.json'));
var data = [];

// var interval = setInterval(function () {
// 	if (stt >= 3){
// 		clearInterval(interval);
// 		crawlUrls();
// 		stt = 0;
// 	}
// }, 1000);

crawlUrls();

function crawlUrls () {
	var wards = places.wards;
	var districts = places.districts;
	for (var i in wards){
		var ward = wards[i];
		var house = {};
		house.city = districts[ward.districtId].cityId;
		house.district = ward.districtId;
		house.ward = i;
		house.url = ward.bdsWardUrl;
		house.type = ward.type;
		house.houseFor = ward.houseFor;
		data.push(house);
	}
	// connection.end();

	// start crawling

	// var interval = setInterval(function () {
	// 	if (stt >= data.length){
	// 		clearInterval(interval);
	// 		// console.log(data);
			
	// 	}
	// 	// console.log(stt + "/" + data.length);
	// }, 1000);

	crawlUrl(0);

	function crawlUrl (index) {
		if (index >= data.length){
			var houses = JSON.parse(fs.readFileSync('houses.json'));
			// console.log(data.length);
			for (var index = 0; index < data.length; index++){
				var housesInWard = data[index];
				// console.log(housesInWard);
				var urls = housesInWard.urls;
				var titles = housesInWard.titles;
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
					house.title = titles[i];
					house.type = data[index].type;
					house.houseFor = data[index].houseFor;
					houses.push(house);
				}
			}
			// console.log(houses);
			fs.writeFileSync('houses.json', JSON.stringify(houses, null, 4));
			return;
		}

		var house = data[index];
		house.urls = [];
		house.titles = [];
		// console.log('------------');
		// console.log(house.url);
		// console.log('------------');
		var options = {
			url: 'http://batdongsan.com.vn' + house.url,
			headers:{
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.84 Safari/537.36'
			}
		}

		request(options, cb(house, options.url));

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
				// console.log("---" + originalUrl + "---");
				console.log(stt + "/" + data.length);
				if (err){
					console.log(err);
				}
				console.log(response.statusCode);
				if (!err && response.statusCode == 200){
					if (originalUrl != response.request.uri.href){
						stt++;
						crawlUrl(index + 1);
						return;
					}
					var $ = cheerio.load(body);
					var items = $('.search-productItem');
					// console.log('items: ' + items.length);
					for (var j = 0; j < items.length; j++) {
						try {
							var houseUrl = $(items[j]).children('.p-title').children('a')[0].attribs.href;
							var houseTitle = $(items[j]).children('.p-title').children('a')[0].attribs.title;
							// console.log(houseTitle);
							h.titles.push(houseTitle);
							// console.log('houseUrl: ' + houseUrl);

							// use h here.
							h.urls.push(houseUrl);
						}
						catch (e){
							console.log(e);
						}
					}
					// console.log(stt);
					stt++;
				}
				else{
					// console.log("url error: " + originalUrl);
					stt++;
				}
				crawlUrl(index + 1);
			}
		}
	}
}