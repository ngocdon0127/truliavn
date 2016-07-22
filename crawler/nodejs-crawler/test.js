var request = require('request');
var fs = require('fs');
var validator = require('validator');

// var data = JSON.parse(fs.readFileSync('batdongsan1.json'));

// request.post('http://batdongsan.com.vn/HandlerWeb/redirect.ashx?IsMainSearch=true', {
// 	form: {
// 		'cboCity': "HN",
// 		// cboCategory: 49,
// 		cboDistrict: 2,
// 		cboTypeRe: 326,
// 		// cboWard: data.wards[841].bdsWardId,
// 		cboWard: 9376,
// 		cboArea: -1,
// 		cboPrice: -1,
// 		cboBedRoom: -1,
// 		cboHomeDirection: -1
// 	}
// }, function (err, response, body) {
// 	if (err){
// 		console.log(err);
// 		return;
// 	}
// 	console.log(response.headers);
// })

// request('http://file4.batdongsan.com.vn/resize/745x510/2016/06/21/20160621071824-c789.jpg', {encoding: 'binary'}, function (err, response, body) {
// 	if (err){
// 		console.log(err);
// 	}
// 	console.log(response.statusCode);
// 	console.log(response.headers);
// 	// console.log(body);
// 	fs.writeFileSync('downloaded.jpg', body, 'binary');
// });

// var data = JSON.parse(fs.readFileSync('data.json'));
// var count = 0;
// var owners = [];

// for (var i = 0; i < data.length; i++) {
// 	count += data[i].images.length;
// 	owners.push(data[i].owner);
// }

// fs.writeFileSync('owner.json', JSON.stringify(owners, null, 4));

// console.log(data.length);

// console.log(count);

// var mysql = require('mysql');
// var config = require('./config.js').MYSQL;
// var connection = mysql.createConnection({
// 	host: config.MYSQL_HOSTNAME,
// 	user: config.MYSQL_USER,
// 	password: config.MYSQL_PASSWORD,
// 	database: config.MYSQL_DB
// });

// var houseIds = [24, 25, 26, 4750, 4751];

// connection.query(
// 	'SELECT * FROM houses WHERE id IN (?)',
// 	[houseIds],
// 	function (err, houses, fields) {
// 		if (err){
// 			console.log(err);
// 		}
// 		else{
// 			console.log(houses);
// 		}
// 		connection.end();
// 	}
// )

// var request = require('request');
// var API_KEY = require('../config/apikey.js').GOOGLE_MAP_API_KEY;

// module.exports = function (router, connection, CITIES, DISTRICTS, WARDS) {

// router.post('/nearby', function (req, res) {
// 	var lat = parseFloat(req.body.lat);
// 	var lon = parseFloat(req.body.lon);
// 	var radius = parseInt(req.body.radius);
// 	var type = req.body.type;
// 	var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lat + "," + lon + "&radius=" + radius + "&types=" + type + "&key=" + API_KEY;
// 	request(url, function (err, response, body) {
// 		if (err || response.statusCode != 200){
// 			return res.status(200).json({
// 				status: 'error',
// 				error: 'Request to Google error'
// 			})
// 		}
// 		res.status(200).json({
// 			status: 'success',
// 			results: JSON.stringigy(body);
// 		})
// 	})
// })

// }

request.post('http://localhost:3000/api/register', {
	form: {
		email: 'test@gmail.com',
		password: '123123',
		repeatPassword: '123123',
		fullname: 'Test account',
		phone: '01676033507',
		address: 'Ha Noi',
		gender: false,
		birthday: (new Date())
	}
}, function (err, response, body) {
	if (err){
		return console.log(err);
	}
	console.log(response.statusCode);
	console.log(body);
})