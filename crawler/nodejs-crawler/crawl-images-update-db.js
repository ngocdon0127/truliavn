var request = require('request');
var fs = require('fs');
var multer = require('multer');
var bcrypt = require('bcrypt-nodejs');
var CryptoJS = require('crypto-js');
var async = require('async');

var mysql = require('mysql');
var connection = require('./database.js').MYSQL();

var UPLOAD_DESTINATION = 'public/uploads/images';
var LOCAL_IMAGES_REGEX = '^' + UPLOAD_DESTINATION;
var uploadImages = multer({dest: UPLOAD_DESTINATION});

var stt = 0;

connection.query(
	'SELECT * FROM images WHERE url NOT REGEXP ?',
	[LOCAL_IMAGES_REGEX],
	function (err, images, fields) {
		if (err){
			console.log(err);
		}
		if (images.length > 0){
			console.log('len: ' + images.length);
			processImages(images, function () {
				var interval = setInterval(function () {
					console.log(stt + "/" + images.length);
					if (stt >= images.length){
						console.log('hehe' + stt + " " + images.length);
						clearInterval(interval);
						connection.end();
						console.log('done');
					}
				}, 2000);
			});
		}
	}
)

function processImages (images, callback) {
	var fns = [];
	function createCB (index) {
		return function (cb) {
			processSingleImage(images, index, callback, cb);
		}
	}
	for (var i = 0; i < images.length; i++) {
		fns.push(createCB(i));
	}

	async.parallelLimit(fns, 20, function (err, results) {
		if (err){
			console.log(err);
		}
		callback();
	})

}

function processSingleImage (images, index, callback, cb) {
	if (index.length >= images.length){
		// callback();
		return
	}
	console.log(index + ":" + images.length);
	// console.log(images[index]);
	request(images[index].url, {encoding: 'binary'}, function (err, response, body) {
		if (err){
			console.log(err);
		}
		// console.log(response.statusCode);
		// console.log(response.headers);
		// console.log(body);
		if (response.statusCode == 200){
			var fileName = UPLOAD_DESTINATION + '/' + CryptoJS.MD5(bcrypt.genSaltSync(100)).toString();
			fs.writeFileSync(fileName, body, 'binary');
			connection.query(
				'UPDATE images SET url = ? WHERE id = ?',
				[fileName, images[index].id],
				function (err, results) {
					if (err){
						console.log(images[index].id + ": error while updating database");
						console.log(err);
					}
					stt++;
					cb();
				}
			)
		}
		else{
			stt++;
			cb();
		}
	});
}