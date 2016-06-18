var request = require('request');
var cheerio = require('cheerio');

console.log("Start crawling...");

// var url = "http://batdongsan.com.vn/cho-thue-can-ho-chung-cu-duong-nguyen-trai-phuong-thuong-dinh-prj-royal-city/ha-noi-noi-that-day-du-lh-0941913999-pr9610095";
var url = "http://batdongsan.com.vn/cho-thue-nha-rieng-duong-pham-viet-chanh-53/chinh-chu-90m-kd-tot-tai-chanh-pr9613890";

var options = {
	url: url,
	headers:{
		'User-Agent': 'request'
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
			// console.log(div.children('.left').text().trim());
			switch (div.children('.left').text().trim()){
				case "Địa chỉ":
					result.address = div.children('.right').text().trim();
					break;
				case "Số phòng ngủ":
					result.bedrooms = parseInt(div.children('.right').text().trim());
					break;
				case "Số toilet":
					result.bathrooms = parseInt(div.children('.right').text().trim());
					break;
				case "Nội thất":
					result.interior = div.children('.right').text().trim();
					break;
			}

		}

		houseInfo = $('.gia-title');
		for (var i = 0; i < houseInfo.length; i++) {
			var element = $(houseInfo[i]);
			console.log(element.children().eq(0).text());
			if (element.children().eq(0).text().trim() == 'Giá:'){
				result.price = parseFloat(element.children('strong').text().trim());
			}
			else if (element.children('b').text().trim() == 'Diện tích:'){
				result.area = parseInt(element.children('strong').text().trim());
			}
		}
		console.log(result);
	}
	else{
		console.log('error')
	}
})
