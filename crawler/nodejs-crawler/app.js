var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var data = fs.readFileSync('houses.json');
var urls = JSON.parse(data.toString()).urls;
var length = urls.length;

// for (var i = 0; i < urls.length; i++) {
	// crawl(i);
// }

var mysql = require('mysql');
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'truliavn'
});

var results = [];

String.prototype.myTrim = function() {
	var s = this.trim();
	s = s.replace(/\r+\n+/g, ' ');
	s = s.replace(/ {2,}/g, ' ');
	return s;
}

crawl(0);

function crawl (index) {
	if (index >= length){
		console.log('done.');
		fs.writeFileSync('data.json', JSON.stringify(results, null, 4));
		saveToDB(0);
		return;
	}
	console.log("Start crawling from:\n\n" + urls[index] + "\n");
	var options = {
		url: urls[index],
		headers:{
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.84 Safari/537.36'
		}
	}
	request(options, function (err, response, body) {
		if (!err && response.statusCode == 200){
			var result = {};
			var $ = cheerio.load(body);
			var houseInfo = $('.left-detail').children();
			// console.log(houseInfo.length);
			// console.log(houseInfo[0].attribs.id)
			for (var i = 0; i < houseInfo.length; i++) {
				var div = houseInfo[i];
				if (div.attribs.hasOwnProperty('id') && div.attribs.id == 'LeftMainContent__productDetail_project'){
					continue;
				}

				div = $(div);
				// console.log(div.children('.left').text().myTrim());
				switch (div.children('.left').text().myTrim()){
					case "Địa chỉ":
						result.address = div.children('.right').text().myTrim();
						break;
					case "Số phòng ngủ":
						result.bedrooms = parseInt(div.children('.right').text().myTrim());
						break;
					case "Số toilet":
						result.bathrooms = parseInt(div.children('.right').text().myTrim());
						break;
					case "Nội thất":
						result.interior = div.children('.right').text().myTrim();
						break;
					case "Số tầng":
						result.floors = parseInt(div.children('.right').text().myTrim());
						break;
					case "Mặt tiền":
						result.frontend = div.children('.right').text().myTrim();
						break;
					case "Đường vào":
						result.entrance = div.children('.right').text().myTrim();
						break;
				}

			}

			houseInfo = $('.gia-title');
			for (var i = 0; i < houseInfo.length; i++) {
				var element = $(houseInfo[i]);
				// console.log(element.children().eq(0).text());
				if (element.children().eq(0).text().myTrim() == 'Giá:'){
					result.price = element.children('strong').text().myTrim();
				}
				else if (element.children('b').text().myTrim() == 'Diện tích:'){
					result.area = element.children('strong').text().myTrim();
				}
			}
			// result.description = unescape($('.pm-content.stat').text().replace(/<div(.|\n|\r)*<\/div>/g, '').myTrim());
			var des = $('.pm-content.stat').html().myTrim();
			des = des.replace(/< ?\/? ?br ?\/? ?>/gi, '\n')
			des = des.replace(/<div(.|\n|\r)*<\/div>/g, '').myTrim();
			// des = des.replace(/< ?\/? ?br ?\/? ?>/g, "\n");
			// des = $(des).text();
			// console.log(des);
			des = des.replace(/Tìm kiếm theo từ khóa:(.|\n|\r)*$/g, '').myTrim();

			result.description = hex2str(des);
			// result.description = des;

			// crawl owner info
			var owner = {};
			var ownerInfo = $('#divCustomerInfo').children();
			for (var i = 0; i < ownerInfo.length; i++) {
				var div = ownerInfo[i];
				if (div.attribs.hasOwnProperty('id')){
					var divId = div.attribs.id;
					div = $(div);
					var data = div.children('.right').text().myTrim();
					switch (divId){
						case 'LeftMainContent__productDetail_contactName':
							owner.fullname = data;
							break;
						case 'LeftMainContent__productDetail_contactAddress':
							owner.address = data;
							break;
						case 'LeftMainContent__productDetail_contactPhone':
							owner.phone = data;
							break;
						case 'LeftMainContent__productDetail_contactMobile':
							owner.mobile = data;
							break;
						case 'LeftMainContent__productDetail_contactEmail':
							var emailData = dec2str(div.children('.right').text().myTrim());
							var match = /\b[\w0-9_]+@([\w0-9_]+\.)+[\w]+/.exec(emailData);
							if (match.length > 0)
								owner.email = match[0];
							break;

					}
				}
			}
			result.owner = owner;

			// crawl images
			var houseImages = $('#thumbs').children();
			var images = [];
			for (var i = 0; i < houseImages.length; i++) {
				var imageUrl = $(houseImages[i]).children()[0].attribs.src;
				images.push(imageUrl.replace('80x60', '745x510'));
			}
			result.images = images;
			
			results.push(result);
			// console.log(result);
		}
		else{
			console.log('error');
		}
		crawl(index + 1);
	})
}

function hex2str (hexstr) {
	while (hexstr.indexOf('&#x') > -1){
		var start = hexstr.indexOf('&#x');
		var stop = hexstr.indexOf(';', start);
		var hex = '0' + hexstr.substring(start + 2, stop);
		// console.log("hex = " + hex);
		var result = hexstr.substring(0, start);
		result += String.fromCharCode(hex);
		result += hexstr.substring(stop + 1);
		hexstr = result;
	}
	return hexstr;
}

function dec2str (decstr) {
	while (decstr.indexOf('&#') > -1){
		var start = decstr.indexOf('&#');
		var stop = decstr.indexOf(';', start);
		var dec = decstr.substring(start + 2, stop);
		// console.log("dec = " + dec);
		var result = decstr.substring(0, start);
		result += String.fromCharCode(dec);
		result += decstr.substring(stop + 1);
		decstr = result;
	}
	return decstr;
}

function saveToDB (i) {
	if (i >= results.length){
		connection.end();
		return;
	}
	connection.query(
		'INSERT INTO test (des) VALUES (?)',
		[results[i].description],
		function (err, result) {
			if (err){
				console.log(err);
			}
			else {
				console.log('ok');
			}
			saveToDB(i + 1);
		}
	)
	return;
}