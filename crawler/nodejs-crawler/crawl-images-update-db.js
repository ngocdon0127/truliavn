var request = require('request');
var fs = require('fs');

var mysql = require('mysql');
var config = require('./config.js').MYSQL;
var connection = mysql.createConnection({
	host: config.MYSQL_HOSTNAME,
	user: config.MYSQL_USER,
	password: config.MYSQL_PASSWORD,
	database: config.MYSQL_DB
});

var LOCAL_IMAGES_REGEX = '^public/uploads/images';

connection.query(
	'SELECT * FROM images WHERE url NOT REGEXP ?',
	[LOCAL_IMAGES_REGEX],
	function (err, images, fields) {
		if (err){
			console.log(err);
		}
		if (images.length > 0){
			// pass
		}
		connection.end();
		console.log('done');
	}
)