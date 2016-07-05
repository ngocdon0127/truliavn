var express = require('express');
var router = express.Router();
var multer = require('multer');
var uploadImages = multer({dest: 'public/uploads/images'});
var fs = require('fs-extra');
var async = require('async');
var mysql = require('mysql');
var request = require('request');
var bcrypt = require('bcrypt-nodejs');
var CryptoJS = require('crypto-js');
var passport = require("passport");

var connection = require('../config/database.js').MYSQL();
var API_KEYS = require('../config/apikey.js');


connection.connect();

var HOUSE_TYPE_CHUNG_CU = 0;
var HOUSE_TYPE_NHA_RIENG = 1;
var HOUSE_TYPE = {
	0: 'Chung cư',
	1: 'Nhà riêng'
}

var HOUSE_FOR_RENT = 0;
var HOUSE_FOR_SELL = 1;
var HOUSE_FOR = {
	0: 'Cho thuê',
	1: 'Rao bán'
}

var HOUSE_STATUS_AVAILABLE = 0;
var HOUSE_STATUS_SELT_OR_RENTED = 1;
var HOUSE_STATUS = {
	0: 'Có sẵn',
	1: 'Đã thuê hoặc đã bán'
}

// data of Cities, Districts and Wards does not change frequently (actually it does no change)
// so, we only need to read it once.
var CITIES = {};
var DISTRICTS = {};
var WARDS = {};

// API about places
require('./places.js')(router, connection, CITIES, DISTRICTS, WARDS);

// API for User operation
require('./users.js')(router, connection, uploadImages, passport);

// API Google Places
require('./gg.js')(router, connection, CITIES, DISTRICTS, WARDS);



/* API */
router.get('/', function(req, res) {
	res.json({'status': 'success'});
});

/**
 * ======================
 *
 * API for House operation
 *
 * ======================
 */

/**
 * Get information of a house
 *
 * @param {integer} houseId id of requested house
 * @query {integer} raw return data from database or preprocessed data.
 */
router.get('/house/:houseId', function (req, res) {
	var houseId = req.params.houseId;
	var raw = req.query.raw;
	getHouses([houseId], raw, 1, function (result) {
		// console.log(result);
		res.status(200).json(result);
	})
})

// houses.id, houses.title, houses.description

function getHouses (houseIds, raw, fullDetail, callback) {
	var infoFields = [
		'userEmail',
		'userFullName',
		'userPhone',
		'userAddress',
		'ownerEmail',
		'ownerFullName',
		'ownerPhone',
		'ownerAddress',
		'ownerMobile',
		'ownerFullName',
		'ownerAddress',
		'ownerMobile',
		'ownerPhone',
		'ownerEmail',
	];
	var sqlQuery = "";
	if (fullDetail){
		sqlQuery = 'SELECT houses.id, houses.type, houses.houseFor, houses.lat, houses.lon, houses.title, houses.address, houses.description, houses.city, houses.district, houses.ward, houses.ownerId, houses.crawledOwnerId, houses.noOfBedrooms, noOfBathrooms, houses.noOfFloors, houses.interior, houses.buildIn, houses.status, houses.created_at, images.url, userEmail, userFullName, userPhone, userAddress, ownerEmail, ownerFullName, ownerPhone, ownerAddress, ownerMobile FROM houses LEFT JOIN images ON houses.id = images.houseId LEFT JOIN (SELECT id AS usersTableId, email AS userEmail, fullname AS userFullName, phone AS userPhone, address AS userAddress FROM users) AS users ON ownerId = usersTableId LEFT JOIN (SELECT id AS ownersTableId, fullname AS ownerFullName, address AS ownerAddress, mobile AS ownerMobile, phone AS ownerPhone, email AS ownerEmail FROM owners) AS owners ON crawledOwnerId = ownersTableId WHERE houses.id IN (?) ORDER BY houses.created_at DESC ';
	}
	else {
		sqlQuery = 'SELECT houses.id, houses.title, houses.address, houses.description, houses.created_at, images.url FROM houses LEFT JOIN images ON houses.id = images.houseId WHERE houses.id IN (?) ORDER BY houses.created_at DESC '
	}
	var sqlTime0 = new Date();
	connection.query(
		sqlQuery,
		[houseIds],
		function (err, rows, fields) {
			var sqlTime1 = new Date();
			console.log('Time query database: ' + (sqlTime1.getTime() - sqlTime0.getTime()));
			if (err){
				console.log(err);
				callback({
					status: 'error',
					error: 'Error while reading database'
				});
				return;
			}
			if (rows.length < 1){
				callback({
					status: 'error',
					error: 'Invalid houseId'
				});
				return;
			}
			var houses = [];
			var tmpIds = {};
			var forT0 = new Date();
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var url = row.url;
				if (url && url.indexOf('public/') > -1){
					url = url.substring("public/".length);
				}
				if (!(row.id in tmpIds)) {
					houses.push(row);
					tmpIds[row.id] = houses.length - 1;
					row.images = [];
					if (url){
						row.images.push(url);
					}
					delete row.url;
					// owner info
					var oi = {};
					row.ownerInfo = oi;
					if (row.ownerId != -1){
						oi.id = row.ownerId;
						oi.email = row.userEmail;
						oi.fullname = row.userFullName;
						oi.phone = row.userPhone;
						oi.address = row.userAddress;
					}
					else{
						oi.id = row.crawledOwnerId;
						oi.email = row.ownerEmail;
						oi.fullname = row.ownerFullName;
						oi.phone = row.ownerPhone;
						oi.address = row.ownerAddress;
						oi.mobile = row.ownerMobile;
					}

					// delete redudant fields
					for (var j = 0; j < infoFields.length; j++) {
						delete row[infoFields[j]]
					}

				}
				else{
					houses[tmpIds[row.id]].images.push(url);
				}
			}
			var forT1 = new Date();
			console.log("For loop time: " + timeExe(forT1, forT0));
			addInfoToHouses(houses, raw, function (h) {
				callback({
					status: 'success',
					houses: h
				})
				var infoT = new Date();
				console.log("addInforToHouses: " + timeExe(infoT, forT1));
			})
		}
	)
}

function timeExe (t1, t0) {
	return t1.getTime() - t0.getTime();
}

function addInfoToHouses (houses, raw, cb) {
	var totalHouse = houses.length;
	var processedHouse = 0;
	var position = {};

	if (raw != '1'){
		for (var i = 0; i < houses.length; i++) {
			var house = houses[i];
			house.type = HOUSE_TYPE[house.type];
			house.houseFor = HOUSE_FOR[house.houseFor];
			house.status = HOUSE_STATUS[house.status];
			if (typeof(CITIES[house.city]) != 'undefined' && CITIES[house.city].hasOwnProperty('cityName'))
				house.city = CITIES[house.city].cityName;
			if (typeof(DISTRICTS[house.district]) != 'undefined' && DISTRICTS[house.district].hasOwnProperty('districtName'))
				house.district = DISTRICTS[house.district].districtName;
			if (typeof(WARDS[house.ward]) != 'undefined' && WARDS[house.ward].hasOwnProperty('wardName'))
				house.ward = WARDS[house.ward].wardName;
		}
	}
	// var houseIds = [];
	// for (var i = 0; i < houses.length; i++) {
	// 	position[houses[i].id] = i;
	// 	houseIds.push(houses[i].id);
	// 	// houses[i].images = [];
	// }
	
	var interval = setInterval(function () {
		console.log(processedHouse + "/" + totalHouse);
		if (processedHouse >= totalHouse){
			clearInterval(interval);
			cb(houses);
		}
	}, 10);

	// end Geo Location

	for (var i = 0; i < houses.length; i++) {
		var house = houses[i];
		if ((house.lat == 0) && (house.lon == 0)){
			var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(house.address) + '&key=' + API_KEYS.GOOGLE_MAP_API_KEY;
			// console.log(url);
			request(url, createCb(house));

			function createCb (house) {
				return function (err, response, body) {
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
								connection.query(
									'UPDATE houses SET lat = ?, lon = ?, formatted_address = ? WHERE id = ?',
									[
										house.lat, house.lon, house.formatted_address, house.id
									],
									function (err, result) {
										if (err){
											console.log(err);
										}
										// don't care.
									}
								)
							}
						}
					}
					processedHouse++;
				}
			}

		}
		else{
			processedHouse++;
		}
	};
}


router.get('/houses', function (req, res) {
	var od0 = new Date();
	var sqlQuery = 'SELECT id FROM houses WHERE 1 ';
	if (req.query.owner){
		sqlQuery += 'AND ownerId = ' + req.query.owner + ' ';
	}
	if (req.query.type){
		switch (req.query.type.toLowerCase()){
			case 'house':
				sqlQuery += 'AND type = ' + HOUSE_TYPE_NHA_RIENG + ' ';
				break;
			case 'apartment':
				sqlQuery += 'AND type = ' + HOUSE_TYPE_CHUNG_CU + ' ';
				break;
			default:
				res.json({
					status: 'error',
					error: 'Invalid value for type parameter'
				});
				return;
		}
	}
	if (req.query.housefor){
		switch (req.query.housefor.toLowerCase()){
			case 'rent':
				sqlQuery += 'AND houseFor = ' + HOUSE_FOR_RENT + ' ';
				break;
			case 'sell':
				sqlQuery += 'AND houseFor = ' + HOUSE_FOR_SELL + ' ';
				break;
			default:
				res.json({
					status: 'error',
					error: 'Invalid value for housefor parameter'
				});
				return;
		}
	}
	if (parseInt(req.query.city)){
		sqlQuery += 'AND city = ' + parseInt(req.query.city) + ' ';
	}
	if (parseInt(req.query.district)){
		sqlQuery += 'AND district = ' + parseInt(req.query.district) + ' ';
	}
	if (parseInt(req.query.ward)){
		sqlQuery += 'AND ward = ' + parseInt(req.query.ward) + ' ';
	}
	if (parseInt(req.query.user)){
		sqlQuery += 'AND ownerId = ' + parseInt(req.query.user) + ' ';
	}
	if (parseInt(req.query.cuser)){
		sqlQuery += 'AND crawledOwnerId = ' + parseInt(req.query.cuser) + ' ';
	}
	sqlQuery += ' ORDER BY created_at DESC';
	console.log(sqlQuery);
	connection.query(
		sqlQuery,
		[],
		function (err, rows, fields) {
			console.log('in function');
			if (err){
				console.log(err);
				res.json({
					status: 'error',
					error: 'Error while reading database'
				});
				return;
			}

			if (rows.length > 0){
				var houseIds = [];
				for (var i = 0; i < rows.length; i++) {
					if (houseIds.indexOf(rows[i].id) < 0){
						houseIds.push(rows[i].id);
					}
				}

				getHouses(houseIds, req.query.raw, (req.query.specific ? 1 : 0), function (h) {
					var od1 = new Date();
					res.json(h)
					console.log('Total time: ' + (od1.getTime() - od0.getTime()));
				})
			}
			else{
				res.json({
					status: 'success',
					houses: []
				})
			}
		}
	)
})

/**
 * Add new house
 *
 * request includes house's information and EMAIL + TOKEN of an authorized user.
 */
router.post('/house', isLoggedIn, uploadImages.array('images'), function (req, res) {
	connection.query(
		'SELECT * FROM users WHERE email = ? AND token = ?',
		[req.body.email, req.body.token],
		function (err, users, fields) {
			if (users.length < 1){
				res.status(200).json({
					status: "error",
					error: "Invalid email and token"
				});
				return;
			}
			var userId = users[0].id;
			var sqlQuery = 	'INSERT INTO houses ' + 
							'(type, address, area, houseFor, noOfBedrooms, noOfBathrooms, interior' + 
							'buildIn, price, ownerId, city, district, ward, description, feePeriod) ' + 
							'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
			var rb = req.body;
			var values = [
				(rb.type == HOUSE_TYPE_CHUNG_CU || rb.type == HOUSE_TYPE_NHA_RIENG) ? rb.type : HOUSE_TYPE_NHA_RIENG, 
				rb.address.trim(), 
				parseFloat(rb.area) ? parseFloat(rb.area) : 0.0, 
				parseInt(rb.houseFor) ? parseInt(rb.houseFor) : HOUSE_FOR_RENT, 
				parseInt(rb.noOfBedrooms) ? parseInt(rb.noOfBedrooms) : 1,
				parseInt(rb.noOfBathrooms) ? parseInt(rb.noOfBathrooms) : 1,
				rb.interior.trim(),
				parseInt(rb.buildIn) ? parseInt(rb.buildIn) : (new Date()).getFullYear(), 
				parseInt(rb.price) ? parseInt(rb.price) : 0, userId, 
				parseInt(rb.city) ? parseInt(rb.city) : 0, 
				parseInt(rb.district) ? parseInt(rb.district) : 0, 
				parseInt(rb.ward) ? parseInt(rb.ward) : 0, 
				rb.description, 
				parseInt(rb.feePeriod) ? parseInt(rb.feePeriod) : 1
			]
			// console.log(sqlQuery);
			// console.log(values);
			connection.query(sqlQuery, values, function (err, result) {
				if (err){
					console.log(err);
				}
				console.log(typeof(result));
				console.log("\n");
				console.log(result);
				console.log("-------------");
				var houseId = result.insertId;
				// add images
				console.log(req.files);
				if (typeof(req.files) != 'undefined'){
					sqlQuery = 'INSERT INTO images (houseId, url) VALUES ';

					for (var i = 0; i < req.files.length; i++) {
						sqlQuery += '("' + houseId + '", "' + req.files[i].path + '"),';
					}
					sqlQuery = sqlQuery.substring(0, sqlQuery.length - 1);
					console.log(sqlQuery);
					connection.query(sqlQuery, [], function (err, result) {
						if (err){
							console.log(err);
						}
						// console.log(result);
						res.json({
							status: "success"
						})
					})
				}
				else{
					res.json({
						status: "success"
					})
				}

			});

		}
	)
})

/**
 * Delete a house
 *
 * request includes house's id and EMAIL + TOKEN of an authorized user.
 */

router.post('/house/delete', function (req, res) {
	connection.query(
		'SELECT * FROM users WHERE email = ? AND token = ?',
		[req.body.email, req.body.token],
		function (err, rows, fields) {
			if (rows.length < 1){
				res.json({
					status: "error",
					error: "Unauthorized."
				});
				return;
			}
			var userId = rows[0].id;
			connection.query(
				'SELECT * from houses WHERE id = ? AND ownerId = ?',
				[req.body.houseId, userId],
				function (err, houses) {
					if (err){
						res.json({
							status: 'error',
							error: 'Error while reading database'
						});
						return;
					};
					if (houses.length < 1){
						res.json({
							status: 'error',
							error: 'There is no house which has that id and ownerId'
						});
						return;
					}
					connection.query(
						'DELETE FROM houses WHERE id = ?',
						[houses[0].id],
						function (err, results) {
							if (err){
								console.log(err);
								res.json({
									status: 'error',
									error: 'Error while deleting house'
								});
								return;
							}
							res.json({
								status: 'success'
							});

							deleteImagesOfHouse(houses[0].id, null);

						}
					)
				}
			)
		}
	)
})

/**
 * Update a house
 *
 * request includes house's id and EMAIL + TOKEN of an authorized user.
 */

router.post('/house/edit', uploadImages.array('images'), function (req, res) {
	console.log(req.body.email);
	console.log(req.body.token);
	var files = req.files;
	console.log('hehe');
	connection.query(
		'SELECT * FROM users WHERE email = ? AND token = ?',
		[req.body.email, req.body.token],
		function (err, users, fields) {
			if (users.length < 1){
				res.json({
					status: "error",
					error: "Unauthorized."
				});
				return;
			}
			var userId = users[0].id;
			connection.query(
				'SELECT * from houses WHERE id = ? AND ownerId = ?',
				[req.body.houseId, userId],
				function (err, houses) {
					if (err){
						res.json({
							status: 'error',
							error: 'Error while reading database'
						});
						return;
					};
					if (houses.length < 1){
						res.json({
							status: 'error',
							error: 'There is no house which has that id and ownerId'
						});
						return;
					}

					// update data here
					var sqlQuery = 	'UPDATE houses SET ' + 
							'type = ?, address = ?, area = ?, houseFor = ?, noOfBedrooms = ?, noOfBathrooms = ?, interior = ?' + 
							'buildIn = ?, price = ?, ownerId = ?, city = ?, district = ?, ward = ?, description = ?, feePeriod = ? ' +
							'WHERE id = ?';
					var rb = req.body;
					var values = [
						rb.type ? rb.type : 0, rb.address.trim(),
						parseFloat(rb.area) ? parseFloat(rb.area) : 0.0,
						parseInt(rb.houseFor) ? parseInt(rb.houseFor) : 0,
						parseInt(rb.noOfBedrooms) ? parseInt(rb.noOfBedrooms) : 1,
						parseInt(rb.noOfBathrooms) ? parseInt(rb.noOfBathrooms) : 1,
						rb.interior,
						parseInt(rb.buildIn) ? parseInt(rb.buildIn) : 2016, 
						parseInt(rb.price) ? parseInt(rb.price) : 0, userId, 
						parseInt(rb.city) ? parseInt(rb.city) : 0,
						parseInt(rb.district) ? parseInt(rb.district) : 0,
						parseInt(rb.ward) ? parseInt(rb.ward) : 0,
						rb.description, 
						parseInt(rb.feePeriod) ? parseInt(rb.feePeriod) : 1,
						req.body.houseId
					];
					console.log(sqlQuery);
					connection.query(sqlQuery, values, function (err, result) {
						if (err){
							console.log(err);
							res.json({
								status: 'error',
								error: 'Error while updating database'
							});
							return;
						}
						var houseId = req.body.houseId;
						console.log(req.files);
						async.series([
							function (callback) {
								console.log('first');
								deleteImagesOfHouse(houseId, callback.bind(this, null, 1));
							},
							function (callback) {
								if (typeof(files) != 'undefined'){
									console.log('second');
									var sqlQuery = 'INSERT INTO images (houseId, url) VALUES ';

									for (var i = 0; i < files.length; i++) {
										sqlQuery += '("' + houseId + '", "' + files[i].path + '"),';
									}
									sqlQuery = sqlQuery.substring(0, sqlQuery.length - 1);
									console.log(sqlQuery);
									connection.query(sqlQuery, [], function (err, result) {
										if (err){
											console.log(err);
										}
										// console.log(result);
										res.json({
											status: "success"
										})
									});
								}
								else{
									res.json({
										status: "success"
									})
								}
								callback(null, 1);
							}
						], function (err, results) {
							if (err){
								console.log(err);
							}
						});
					})
				}
			)
		}
	)
})


/* debugging API */

router.get('/test', function (req, res) {
	res.json({
		city: CITIES,
		district: DISTRICTS,
		ward: WARDS
	})
})


// throw 404 for other endpoints
router.get('*', function (req, res) {
	res.json({'status': 'error', 'error': 'Invalid API endpoint.'});
})

router.post('*', function (req, res) {
	res.json({'status': 'error', 'error': 'Invalid API endpoint.'});
})

router.put('*', function (req, res) {
	res.json({'status': 'error', 'error': 'Invalid API endpoint.'});
})

router.delete('*', function (req, res) {
	res.json({'status': 'error', 'error': 'Invalid API endpoint.'});
})

function deleteImagesOfHouse (houseId, fn) {
	connection.query(
		'SELECT url FROM images WHERE houseId = ?',
		[houseId],
		function (err, urls, fields) {
			if (!err && urls.length > 0){
				for (var i = 0; i < urls.length; i++) {
					console.log('removing ' + urls[i].url);
					fs.removeSync(urls[i].url)
				}
				connection.query('DELETE FROM images WHERE houseId = ?', houseId, function (err, result) {
					if (!err){
						console.log('call fn');
						if (fn){
							fn();
						}
					}
				})
			}
			else{
				if (fn) fn();
			}
		}
	)
}

function isLoggedIn (req, res, next) {
	if (req.isAuthenticated()){
		return next();
	}
	res.status(401).json({
		status: 'error',
		error: 'Unauthorized'
	});
}

module.exports = router;

'SELECT houses.id, houses.type, houses.houseFor, houses.lat, houses.lon, houses.title, houses.address, houses.description, houses.city, houses.district, houses.ward, houses.ownerId, houses.crawledOwnerId, houses.noOfBedrooms, noOfBathrooms, houses.noOfFloors, houses.interior, houses.buildIn, houses.created_at, images.url, userEmail, userFullName, userPhone, userAddress, ownerEmail, ownerFullName, ownerPhone, ownerAddress, ownerMobile FROM houses LEFT JOIN images ON houses.id = images.houseId LEFT JOIN (SELECT id AS usersTableId, email AS userEmail, fullname AS userFullName, phone AS userPhone, address AS userAddress FROM users) AS users ON ownerId = usersTableId LEFT JOIN (SELECT id AS ownersTableId, fullname AS ownerFullName, address AS ownerAddress, mobile AS ownerMobile, phone AS ownerPhone, email AS ownerEmail FROM owners) AS owners ON crawledOwnerId = ownersTableId WHERE houses.id IN (?) ORDER BY houses.created_at DESC '

'SELECT houses.id, houses.type, houses.houseFor, houses.lat, houses.lon, houses.title, houses.address, houses.description, houses.city, houses.district, houses.ward, houses.ownerId, houses.crawledOwnerId, houses.noOfBedrooms, noOfBathrooms, houses.noOfFloors, houses.interior, houses.buildIn, images.url, userEmail, userFullName, userPhone, userAddress, ownerEmail, ownerFullName, ownerPhone, ownerAddress, ownerMobile FROM houses LEFT JOIN images ON houses.id = images.houseId LEFT JOIN (SELECT id AS usersTableId, email AS userEmail, fullname AS userFullName, phone AS userPhone, address AS userAddress FROM users) AS users ON ownerId = usersTableId LEFT JOIN (SELECT id AS ownersTableId, fullname AS ownerFullName, address AS ownerAddress, mobile AS ownerMobile, phone AS ownerPhone, email AS ownerEmail FROM owners) AS owners ON crawledOwnerId = ownersTableId WHERE houses.id IN (SELECT id FROM houses) ORDER BY houses.created_at DESC'