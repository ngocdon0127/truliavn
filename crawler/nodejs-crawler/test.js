var request = require('request');
var fs = require('fs');

var data = JSON.parse(fs.readFileSync('batdongsan1.json'));

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

var mysql = require('mysql');
var config = require('./config.js').MYSQL;
var connection = mysql.createConnection({
	host: config.MYSQL_HOSTNAME,
	user: config.MYSQL_USER,
	password: config.MYSQL_PASSWORD,
	database: config.MYSQL_DB
});

var houseIds = [24, 25, 26, 4750, 4751];

connection.query(
	'SELECT * FROM houses WHERE id IN (?)',
	[houseIds],
	function (err, houses, fields) {
		if (err){
			console.log(err);
		}
		else{
			console.log(houses);
		}
		connection.end();
	}
)