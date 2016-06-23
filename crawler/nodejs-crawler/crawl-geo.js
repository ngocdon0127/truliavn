var fs = require('fs');
var request = require('request');

var API_KEY = require('./config.js').API_KEY;

var houses = JSON.parse(fs.readFileSync('data.json'));

function getGeo (index) {
	console.log(index);
	if (index >= 100){
		fs.writeFileSync('data.json', JSON.stringify(houses, null, 4));
		return;
	}
	var house = houses[index];
	var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(house.address) + '&key=' + API_KEY;
	// console.log(url);
	request(url, function (err, response, body) {
		if (err){
			console.log(err);
		}
		else{
			if (response.statusCode == 200){
				body = JSON.parse(body);
				// console.log(body);
				if ((body.status == 'OK') && (body.results.length > 0)) {
					var result = body.results[0];
					house.lat = result.geometry.location.lat;
					house.lon = result.geometry.location.lng;
					house.formatted_address = result.formatted_address;
				}
			}
		}
		getGeo(index + 1);
	});
}

getGeo(0);