var request = require('request');
var API_KEY = require('../config/apikey.js').GOOGLE_MAP_API_KEY;

module.exports = function (router, connection, CITIES, DISTRICTS, WARDS) {

router.post('/nearby', function (req, res) {
	var lat = parseFloat(req.body.lat);
	var lon = parseFloat(req.body.lon);
	var radius = parseInt(req.body.radius);
	var type = req.body.type;
	var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lat + "," + lon + "&radius=" + radius + "&types=" + type + "&key=" + API_KEY;
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

}