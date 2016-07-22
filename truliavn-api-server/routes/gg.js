var request = require('request');
var API_KEY = require('../config/apikey.js').GOOGLE_MAP_API_KEY;

module.exports = function (router, connection, CITIES, DISTRICTS, WARDS, STREETS) {

	router.post('/nearby', function (req, res) {
		var lat = parseFloat(req.body.lat);
		var lon = parseFloat(req.body.lon);
		var radius = parseInt(req.body.radius);
		var type = req.body.type;
		var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" 
					+ lat + "," + lon 
					+ "&radius=" + radius 
					+ "&types=" + type 
					+ "&key=" + API_KEY;
		request(url, function (err, response, body) {
			if (err || response.statusCode != 200){
				return res.status(200).json({
					status: 'error',
					error: 'Request to Google error'
				})
			}
			res.status(200).json({
				status: 'success',
				results: JSON.parse(body)
			})
		})
	})

	router.post('/distance', function (req, res) {
		var origin = req.body.origin;
		var destination = req.body.destination;
		var url = "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins="
		 		+ origin 
		 		+ "&destinations="
		 		+ destination
		 		+ "&key="+ API_KEY;
		 console.log(url);
		request(url, function (err, response, body) {
			if (err || response.statusCode != 200){
				return res.status(200).json({
					status : 'error',
					error : 'Request fail'
				})
			}
			res.status(200).json({
				status : 'success',
				results : JSON.parse(body)
			})
		})
	})

	router.post('/coordinate', function (req, res) {
		var address = req.body.address;
		console.log('address : ' + address);
		var url = "https://maps.googleapis.com/maps/api/geocode/json?&address="
			+ address;
		console.log(url);
		request(url, function (err, response, body) {
			if (err || response.statusCode != 200){
				return res.status(200).json({
					status : 'error',
					error : 'Request fail'
				})
			}
			res.status(200).json({
				status : 'success',
				coordinate : JSON.parse(body)
			})
		})
	})
}

