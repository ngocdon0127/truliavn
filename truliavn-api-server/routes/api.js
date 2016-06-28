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

var connection = require('../config/database.js')();
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
require('./users.js')(router, connection, uploadImages);



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
	getHouses([houseId], raw, function (result) {
		res.status(200).json({
			status: 'success',
			house: result[0]
		});
	})
})

function getHouses (houseIds, raw, callback) {
	var sqlQuery = 'SELECT * FROM Houses WHERE id IN (?) '
	connection.query(
		sqlQuery,
		[houseIds],
		function (err, houses, fields) {
			if (err){
				console.log(err);
				callback({
					status: 'error',
					error: 'Error while reading database'
				});
				return;
			}
			if (houses.length < 1){
				callback({
					status: 'error',
					error: 'Invalid houseId'
				});
				return;
			}
			addInfoToHouses(houses, raw, function (r) {
				callback(r);
			})
		}
	)
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
	var houseIds = [];
	for (var i = 0; i < houses.length; i++) {
		position[houses[i].id] = i;
		houseIds.push(houses[i].id);
		houses[i].images = [];
	}
	connection.query(
		'SELECT * FROM Images WHERE houseId IN (?)',
		[houseIds],
		function (err, images, fields) {
			if (err){
				console.log(err);
				// house.images = null;
			}
			for (var i = 0; i < images.length; i++) {
				if (images[i].url.indexOf('public/') > -1){
					// console.log(images[i]);
					// console.log(images[i].houseId);
					// console.log(houses[6652]);
					houses[position[images[i].houseId]].images.push(images[i].url.substring("public/".length));
				}
				else{
					houses[position[images[i].houseId]].images.push(images[i].url);
				}
			}

			// add Geo Location
			var interval = setInterval(function () {
				console.log(processedHouse + "/" + totalHouse);
				if (processedHouse >= totalHouse){
					clearInterval(interval);
					cb(houses);
				}
			}, 500);
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
											'UPDATE Houses SET lat = ?, lon = ?, formatted_address = ? WHERE id = ?',
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
							addOwnerInfo(house, function () {
								processedHouse++;
							});
						}
					}

				}
				else{
					addOwnerInfo(house, function () {
						processedHouse++;
					});
				}
			};
		}
	)
}

function addOwnerInfo (house, callback) {
	if (house.ownerId > -1){
		connection.query(
			'SELECT * FROM Users WHERE id = ?',
			[house.ownerId],
			function (err, users, fields) {
				if (!err || users.length > 0){
					var owner = users[0];
					delete owner.password;
					delete owner.token;
					house.ownerInfo = owner;
				}
				callback();
			}
		)
	}
	else{
		connection.query(
			'SELECT * FROM owners WHERE id = ?',
			[house.crawledOwnerId],
			function (err, owners, fields) {
				if (!err || owners.length > 0){
					var owner = owners[0];
					house.ownerInfo = owner;
					// console.log(owner);
					// console.log(typeof(owner));
					// console.log(owner.name);
				}
				callback();
			}
		)
	}
}

router.get('/houses', function (req, res) {
	var sqlQuery = 'SELECT * FROM Houses WHERE 1 ';
	if (req.query.owner){
		sqlQuery += 'AND ownerId = ' + req.query.owner + ' ';
	}
	if (req.query.type){
		switch (req.query.type.toLowerCase()){
			case 'nha-rieng':
				sqlQuery += 'AND type = ' + HOUSE_TYPE_NHA_RIENG + ' ';
				break;
			case 'chung-cu':
				sqlQuery += 'AND type = ' + HOUSE_TYPE_CHUNG_CU + ' ';
				break;
		}
	}
	if (req.query.housefor){
		switch (req.query.housefor.toLowerCase()){
			case 'thue':
				sqlQuery += 'AND houseFor = ' + HOUSE_FOR_RENT + ' ';
				break;
			case 'ban':
				sqlQuery += 'AND houseFor = ' + HOUSE_FOR_SELL + ' ';
				break;
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
	sqlQuery += ' ORDER BY created_at DESC';
	console.log(sqlQuery);
	connection.query(
		sqlQuery,
		[],
		function (err, houses, fields) {
			console.log('in function');
			if (err){
				console.log(err);
				res.json({
					status: 'error',
					error: 'Error while reading database'
				});
				return;
			}

			if (houses.length > 0){
				addInfoToHouses(houses, req.query.raw, function (h) {
					res.json({
						status: 'success',
						houses: h
					})
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
router.post('/house', uploadImages.array('images'), function (req, res) {
	connection.query(
		'SELECT * FROM Users WHERE email = ? AND token = ?',
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
			var sqlQuery = 	'INSERT INTO Houses ' + 
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
					sqlQuery = 'INSERT INTO Images (houseId, url) VALUES ';

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
		'SELECT * FROM Users WHERE email = ? AND token = ?',
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
				'SELECT * from Houses WHERE id = ? AND ownerId = ?',
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
						'DELETE FROM Houses WHERE id = ?',
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
		'SELECT * FROM Users WHERE email = ? AND token = ?',
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
				'SELECT * from Houses WHERE id = ? AND ownerId = ?',
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
					var sqlQuery = 	'UPDATE Houses SET ' + 
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
									var sqlQuery = 'INSERT INTO Images (houseId, url) VALUES ';

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
		'SELECT url FROM Images WHERE houseId = ?',
		[houseId],
		function (err, urls, fields) {
			if (!err && urls.length > 0){
				for (var i = 0; i < urls.length; i++) {
					console.log('removing ' + urls[i].url);
					fs.removeSync(urls[i].url)
				}
				connection.query('DELETE FROM Images WHERE houseId = ?', houseId, function (err, result) {
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

module.exports = router;