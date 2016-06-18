var request = require('request');
var cheerio = require('cheerio');

console.log("Start crawling...");

var url = "http://batdongsan.com.vn/cho-thue-can-ho-chung-cu-duong-nguyen-trai-phuong-thuong-dinh-prj-royal-city/ha-noi-noi-that-day-du-lh-0941913999-pr9610095";

request(url, function (err, response, body) {
	if (!err && response.statusCode == 200){
		var $ = cheerio.load(body);
		$('.left-detail').children().each(function (child) {
			console.log(child)
		})
	}
	else{
		console.log('error')
	}
})
