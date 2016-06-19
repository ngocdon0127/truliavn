var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var data = fs.readFileSync('houses.json');
var urls = JSON.parse(data.toString()).urls;
var length = urls.length;

// for (var i = 0; i < urls.length; i++) {
	// crawl(i);
// }

crawl(0);

function crawl (index) {
	if (index >= length){
		console.log('done.');
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
					case "Số tầng":
						result.floors = parseInt(div.children('.right').text().trim());
				}

			}

			houseInfo = $('.gia-title');
			for (var i = 0; i < houseInfo.length; i++) {
				var element = $(houseInfo[i]);
				// console.log(element.children().eq(0).text());
				if (element.children().eq(0).text().trim() == 'Giá:'){
					result.price = element.children('strong').text().trim();
				}
				else if (element.children('b').text().trim() == 'Diện tích:'){
					result.area = element.children('strong').text().trim();
				}
			}
			// result.description = unescape($('.pm-content.stat').text().replace(/<div(.|\n|\r)*<\/div>/g, '').trim());
			var des = $('.pm-content.stat').text().trim().replace(/< ?\/? ?br ?\/? ?>/g, "\n")
			// des = des.replace(/< ?\/? ?br ?\/? ?>/g, "\n");
			// des = $(des).text();
			// console.log(des);
			result.description = des.replace(/Tìm kiếm theo từ khóa:(.|\n|\r)*$/g, '').trim();
			console.log(result);
		}
		else{
			console.log('error');
		}
		crawl(index + 1);
	})
}
