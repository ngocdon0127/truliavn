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
var CONST = JSON.parse(fs.readFileSync(__dirname + '/../config/const.json'));
// var CONST = {};
// var mongoose = require('mongoose');
// var Permission = mongoose.model('Permission');
// Permission.findOne({}, function (err, permission) {
// 	if (err || !permission){
// 		console.log(err);
// 		console.log(permission);
// 		process.exit(1);
// 	}
// 	// console.log(permission);
// 	CONST = permission;
// 	console.log('CONST OK');
// })
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
var HOUSE_FOR_NEED_BUY = 2;
var HOUSE_FOR_NEED_RENT = 3;
var HOUSE_FOR = {
	0: 'Cho thuê',
	1: 'Rao bán',
	2: 'Cần mua',
	3: 'Cần thuê'
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
var STREETS = {};

// API about places
require('./places.js')(router, connection, CITIES, DISTRICTS, WARDS, STREETS);

// API for User operation
require('./users.js')(router, connection, uploadImages);

// API Google Places
require('./gg.js')(router, connection, CITIES, DISTRICTS, WARDS, STREETS);

// API permission
require('./permission.js')(router, connection);



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
		'userUserName',
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
		sqlQuery = 'SELECT houses.id, houses.hidden, houses.type, houses.houseFor, houses.lat, houses.lon, houses.title, houses.address, houses.formatted_address, houses.price, houses.feePeriod, houses.area, houses.description, houses.city, houses.district, houses.ward, houses.street, houses.ownerId, houses.crawledOwnerId, houses.noOfBedrooms, noOfBathrooms, houses.noOfFloors, houses.interior, houses.buildIn, houses.status, houses.created_at, images.url, userEmail, userUserName, userFullName, userPhone, userAddress, ownerEmail, ownerFullName, ownerPhone, ownerAddress, ownerMobile FROM houses LEFT JOIN images ON houses.id = images.houseId LEFT JOIN (SELECT id AS usersTableId, email AS userEmail, username AS userUserName, fullname AS userFullName, phone AS userPhone, address AS userAddress FROM users) AS users ON ownerId = usersTableId LEFT JOIN (SELECT id AS ownersTableId, fullname AS ownerFullName, address AS ownerAddress, mobile AS ownerMobile, phone AS ownerPhone, email AS ownerEmail FROM owners) AS owners ON crawledOwnerId = ownersTableId WHERE houses.id IN (?) ORDER BY houses.id DESC ';
	}
	else {
		sqlQuery = 'SELECT houses.id, houses.hidden, houses.title, houses.area, houses.address, houses.formatted_address, houses.price, houses.description, houses.created_at, images.url FROM houses LEFT JOIN images ON houses.id = images.houseId WHERE houses.id IN (?) ORDER BY houses.id DESC '
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
						oi.username = row.userUserName;
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

router.get('/average/:scope/:scopeId', function (req, res) {
	if (['district', 'ward'].indexOf(req.params.scope) < 0){
		return res.status(400).json({
			status: 'error',
			error: "Invalid scope. Scope must be 'district' or 'ward'"
		})
	}
	var sqlQuery = 'SELECT id FROM houses WHERE hidden = 0 AND houseFor = ' + HOUSE_FOR_SELL + ' AND ' + (req.params.scope.localeCompare('district') == 0 ? 'district = ' : 'ward = ') + parseInt(req.params.scopeId);
	console.log(sqlQuery);
	connection.query(
		sqlQuery,
		[],
		function (err, rows, fields) {
			if (err){
				return res.status(500).json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
			if (rows.length < 1){
				return res.status(200).json({
					status: 'success',
					scope: req.params.scope,
					scopeId: req.params.scopeId,
					avgPrice: 0,
					noOfHouses: 0
				})
			}
			var houseIds = [];
			for (var i = 0; i < rows.length; i++) {
				houseIds.push(rows[i].id);
			}
			getHouses(houseIds, 1, 0, function (data) {
				// console.log(data);
				if (data.status == 'success'){
					var houses = data.houses;
					var noOfHouses = 0;
					var averagePrice = 0;
					for (var i = 0; i < houses.length; i++) {
						var house = houses[i];
						if ((house.area > 0) && (house.price > 0)){
							noOfHouses++;
							averagePrice += house.price / house.area;
						}
					}
					averagePrice /= noOfHouses;
					if (req.params.scope.localeCompare('ward') == 0){
						return res.status(200).json({
							status: 'success',
							scope: req.params.scope,
							scopeId: req.params.scopeId,
							avgPrice: averagePrice,
							noOfHouses: noOfHouses
						})
					}
					connection.query(
						'SELECT * FROM price WHERE district = ?',
						[parseInt(req.params.scopeId)],
						function (err, rows, fields) {
							if (err || rows.length < 1){
								console.log(err);
								console.log(rows.length);
								return res.status(200).json({
									status: 'success',
									scope: req.params.scope,
									scopeId: req.params.scopeId,
									avgPrice: averagePrice,
									noOfHouses: noOfHouses
								})
							}
							var minOfficialPrice = 0;
							var maxOfficialPrice = 0;
							for (var i = 0; i < rows.length; i++) {
								var row = rows[i];
								var tmp = 0;
								// for (var j = 0; j < [1, 2, 3, 4].length; j++) {
								// 	tmp += parseInt(row['area_' + [1, 2, 3, 4][j] + '_price']);
								// }
								// tmp = parseInt(row['area_1_price']) * 4;
								// officialPrice += tmp / 4;
								minOfficialPrice = i ? Math.min(minOfficialPrice, parseInt(row['area_4_price'])) : parseInt(row['area_4_price']);
								maxOfficialPrice = i ? Math.max(maxOfficialPrice, parseInt(row['area_1_price'])) : parseInt(row['area_1_price']);
							}
							// officialPrice /= rows.length;
							return res.status(200).json({
									status: 'success',
									scope: req.params.scope,
									scopeId: req.params.scopeId,
									avgPrice: averagePrice,
									noOfHouses: noOfHouses,
									minAvgListingPrice: minOfficialPrice / 1000,
									maxAvgListingPrice: maxOfficialPrice / 1000
								})
						}
					)
					
				}
				else{
					return res.status(200).json(data)
				}
			})
		}
	)
})

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
	var includehidden = false;
	if (req.query.owner){
		sqlQuery += 'AND ownerId = ' + req.query.owner + ' ';
		includehidden = true;
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
			case 'needrent':
				sqlQuery += 'AND houseFor = ' + HOUSE_FOR_NEED_RENT + ' ';
				break;
			case 'needbuy':
				sqlQuery += 'AND houseFor = ' + HOUSE_FOR_NEED_BUY + ' ';
				break;
			default:
				return res.status(400).json({
					status: 'error',
					error: 'Invalid value for housefor parameter'
				});
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
	if (parseInt(req.query.street)){
		sqlQuery += 'AND street = ' + parseInt(req.query.street) + ' ';
	}
	if (parseInt(req.query.cuser)){
		sqlQuery += 'AND crawledOwnerId = ' + parseInt(req.query.cuser) + ' ';
	}
	if (parseInt(req.query.minArea)){
		sqlQuery += 'AND area >= ' + parseInt(req.query.minArea) + ' ';
	}
	if (parseInt(req.query.maxArea)){
		sqlQuery += 'AND area <= ' + parseInt(req.query.maxArea) + ' ';
	}
	if (parseInt(req.query.minPrice) >= 0){
		sqlQuery += 'AND price >= ' + parseInt(req.query.minPrice) + ' ';
	}
	if (parseInt(req.query.maxPrice) >= 0){
		sqlQuery += 'AND price <= ' + parseInt(req.query.maxPrice) + ' ';
	}
	if (parseInt(req.query.bedrooms)){
		sqlQuery += 'AND noOfBedrooms >= ' + parseInt(req.query.bedrooms) + ' ';
	}
	if (parseInt(req.query.bathrooms)){
		sqlQuery += 'AND noOfBedrooms >= ' + parseInt(req.query.bathrooms) + ' ';
	}
	if (parseInt(req.query.floors)){
		sqlQuery += 'AND noOfFloors >= ' + parseInt(req.query.floors) + ' ';
	}
	if ('includehidden' in req.query){
		includehidden = req.query.includehidden ? true : false;
	}
	if (!includehidden){
		sqlQuery += 'AND hidden = 0 ';
	}
	if ('hidden' in req.query){
		switch (parseInt(req.query.hidden)){
			case 0:
				sqlQuery += 'AND hidden = 0 ';
				break;
			case 1:
				sqlQuery += 'AND hidden = 1 ';
				break;
			default:
				return res.status(400).json({
					status: 'error',
					error: 'Invalid value for hidden parameter'
				})
		}
	}
	var limit = parseInt(req.query.count);
	if (limit == -1){
		sqlQuery += 'ORDER BY id DESC';
	}
	else{
		limit = (limit > 0) ? limit : 300;
		var offset = parseInt(req.query.offset);
		offset = (offset > 0) ? offset : 0;
		sqlQuery += 'ORDER BY id DESC LIMIT ' + offset + ', ' + limit;
	}
	console.log(sqlQuery);
	connection.query(
		sqlQuery,
		[],
		function (err, rows, fields) {
			console.log('in function');
			if (err){
				console.log(err);
				res.status(500).json({
					status: 'error',
					error: 'Error while reading database'
				});
				return;
			}

			if (req.query.onlycount == 1){
				return res.status(200).json({
					status: 'success',
					count: rows.length
				})
			}

			if (rows.length > 0){
				var houseIds = [];
				for (var i = 0; i < rows.length; i++) {
					// wtf? why did i need to check this???
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
				res.status(200).json({
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
	var rb = req.body;
	// console.log(req.files);
	// console.log(req.body);
	// return;
	// console.log(rb.noOfBathrooms);
	// console.log(parseInt(rb.noOfBathrooms));
	var missingParam = checkRequiredParams(['email', 'token'], rb);
	if (missingParam){
		return responseMissing(missingParam, res);
	}
	connection.query(
		'SELECT * FROM users WHERE email = ? AND token = ?',
		[req.body.email, req.body.token],
		function (err, users, fields) {
			if (users.length < 1){
				return res.status(400).json({
					status: "error",
					error: "Invalid email and token"
				});
			}
			var userId = users[0].id;
			var sqlQuery = 	'INSERT INTO houses ' + 
							'(type, title, address, area, houseFor, noOfBedrooms, noOfBathrooms, noOfFloors, interior, ' + 
							'buildIn, price, ownerId, city, district, ward, street, description, feePeriod) ' + 
							'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
			var values = [
				(rb.type == HOUSE_TYPE_CHUNG_CU || rb.type == HOUSE_TYPE_NHA_RIENG) ? rb.type : HOUSE_TYPE_NHA_RIENG,
				rb.title ? rb.title.trim() : 'Nhà',
				rb.address ? rb.address.trim() : '',
				parseFloat(rb.area) ? parseFloat(rb.area) : 0.0,
				parseInt(rb.houseFor) ? parseInt(rb.houseFor) : HOUSE_FOR_RENT,
				parseInt(rb.noOfBedrooms) ? parseInt(rb.noOfBedrooms) : 1,
				parseInt(rb.noOfBathrooms) ? parseInt(rb.noOfBathrooms) : 1,
				parseInt(rb.noOfFloors) ? parseInt(rb.noOfFloors) : 1,
				rb.interior ? rb.interior.trim() : '',
				parseInt(rb.buildIn) ? parseInt(rb.buildIn) : (new Date()).getFullYear(),
				parseInt(rb.price) ? parseInt(rb.price) : 0,
				userId,
				parseInt(rb.city) ? parseInt(rb.city) : 0,
				parseInt(rb.district) ? parseInt(rb.district) : 0,
				parseInt(rb.ward) ? parseInt(rb.ward) : 0,
				parseInt(rb.street) ? parseInt(rb.street) : 0,
				rb.description ? rb.description.trim() : '',
				parseInt(rb.feePeriod) ? parseInt(rb.feePeriod) : 1
			]
			// console.log(sqlQuery);
			// console.log(values);
			connection.query(sqlQuery, values, function (err, result) {
				if (err){
					console.log(err);
					return res.status(500).json({
						status: 'error',
						error: 'Error while inserting to database'
					});
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
						res.status(200).json({
							status: "success"
						})
					})
				}
				else{
					res.status(200).json({
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
	var missingParam = checkRequiredParams(['email', 'token', 'houseId'], req.body);
	if (missingParam){
		return responseMissing(missingParam, res);
	}
	connection.query(
		'SELECT * FROM users WHERE email = ? AND token = ?',
		[req.body.email, req.body.token],
		function (err, rows, fields) {
			if (rows.length < 1){
				res.status(401).json({
					status: "error",
					error: "Unauthorized."
				});
				return;
			}
			var userId = rows[0].id;
			connection.query(
				'SELECT * FROM houses WHERE id = ?',
				[req.body.houseId],
				function (err, houses) {
					if (err){
						return res.status(500).json({
							status: 'error',
							error: 'Error while reading database'
						});
					};
					if (houses.length < 1){
						return res.status(400).json({
							status: 'error',
							error: 'There is no house which has that id'
						});
					}
					if ((houses[0].ownerId != userId) && (rows[0].permission < CONST.PERMS.PERM_DELETE_HOUSE.perm)){
						return res.status(403).json({
							status: 'error',
							error: 'You don\'t have permission to delete this house'
						})
					}
					connection.query(
						'DELETE FROM houses WHERE id = ?',
						[houses[0].id],
						function (err, results) {
							if (err){
								console.log(err);
								res.status(500).json({
									status: 'error',
									error: 'Error while deleting house'
								});
								return;
							}
							res.status(200).json({
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
	var missingParam = checkRequiredParams(['email', 'token', 'houseId'], req.body);
	if (missingParam){
		return responseMissing(missingParam, res);
	}
	connection.query(
		'SELECT * FROM users WHERE email = ? AND token = ?',
		[req.body.email, req.body.token],
		function (err, users, fields) {
			if (users.length < 1){
				res.status(401).json({
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
						res.status(500).json({
							status: 'error',
							error: 'Error while reading database'
						});
						return;
					};
					if (houses.length < 1){
						res.status(400).json({
							status: 'error',
							error: 'There is no house which has that id and ownerId'
						});
						return;
					}

					// update data here
					var sqlQuery = 	'UPDATE houses SET ' + 
							'type = ?, title = ?, address = ?, area = ?, houseFor = ?, noOfBedrooms = ?, noOfBathrooms = ?, noOfFloors = ?, interior = ?, ' + 
							'buildIn = ?, price = ?, ownerId = ?, city = ?, district = ?, ward = ?, street = ?, description = ?, feePeriod = ? ' +
							'WHERE id = ?';
					var rb = req.body;
					var values = [
						rb.type ? rb.type : 0,
						rb.title.trim(),
						rb.address.trim(),
						parseFloat(rb.area) ? parseFloat(rb.area) : 0.0,
						parseInt(rb.houseFor) ? parseInt(rb.houseFor) : 0,
						parseInt(rb.noOfBedrooms) ? parseInt(rb.noOfBedrooms) : 1,
						parseInt(rb.noOfBathrooms) ? parseInt(rb.noOfBathrooms) : 1,
						parseInt(rb.noOfFloors) ? parseInt(rb.noOfFloors) : 1,
						rb.interior,
						parseInt(rb.buildIn) ? parseInt(rb.buildIn) : 2016,
						parseInt(rb.price) ? parseInt(rb.price) : 0,
						userId,
						parseInt(rb.city) ? parseInt(rb.city) : 0,
						parseInt(rb.district) ? parseInt(rb.district) : 0,
						parseInt(rb.ward) ? parseInt(rb.ward) : 0,
						parseInt(rb.street) ? parseInt(rb.street) : 0,
						rb.description,
						parseInt(rb.feePeriod) ? parseInt(rb.feePeriod) : 1,
						req.body.houseId
					];
					console.log(sqlQuery);
					connection.query(sqlQuery, values, function (err, result) {
						if (err){
							console.log(err);
							res.status(500).json({
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
								if ((typeof(files) != 'undefined') && (files.length > 0)){
									deleteImagesOfHouse(houseId, callback.bind(this, null, 1));
								}
								else{
									callback(null, 1);
								}
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
										res.status(200).json({
											status: "success"
										})
									});
								}
								else{
									res.status(200).json({
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

String.prototype.myTrim = function() {
	var s = this.trim();
	s = s.replace(/\r+\n+/g, ' ');
	s = s.replace(/ {2,}/g, ' ');
	return s;
}

String.prototype.vi2en = function() {
	var str = this.myTrim();
	str= str.toLowerCase(); 
	str= str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a"); 
	str= str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e"); 
	str= str.replace(/ì|í|ị|ỉ|ĩ/g, "i"); 
	str= str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o"); 
	str= str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u"); 
	str= str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y"); 
	str= str.replace(/đ/g, "d"); 
	return str;
}

router.post('/search', function (req, res) {
	var WHOLE_SEARCH_MATCHED_RANK = 100;
	var SINGLE_WORD_SEARCH_MATCHED_RANK = 1;
	var REGEX_SINGLE_WORD = /(\w+)/g;
	if (!req.body.search){
		return res.status(400).json({
			status: 'error',
			error: 'Missing search argument'
		})
	}
	
	var searchData = req.body.search.myTrim().vi2en().toLowerCase();
	var words = searchData.match(REGEX_SINGLE_WORD);
	console.log(searchData);
	var sqlQuery = 'SELECT id FROM houses WHERE 1 ';
	switch (req.body.housefor){
		case 'rent':
			sqlQuery += 'AND houseFor = ' + HOUSE_FOR_RENT + ' ';
			break;
		case 'sell':
			sqlQuery += 'AND houseFor = ' + HOUSE_FOR_SELL + ' ';
			break;
		case 'needrent':
			sqlQuery += 'AND houseFor = ' + HOUSE_FOR_NEED_RENT + ' ';
			break;
		case 'needbuy':
			sqlQuery += 'AND houseFor = ' + HOUSE_FOR_NEED_BUY + ' ';
			break;
		default:
			break;
	}
	sqlQuery += 'AND hidden = 0 ';
	sqlQuery += 'ORDER BY id DESC';
	// console.log(sqlQuery);
	// return;
	connection.query(
		sqlQuery,
		[],
		function (err, ids, fields) {
			if (err){
				return res.status(500).json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
			if (ids.length < 1){
				return res.status(200).json({
					status: 'success',
					houses: []
				})
			}
			var houseIds = [];
			for (var i = 0; i < ids.length; i++) {
				houseIds.push(ids[i].id);
			}
			// return res.json({data: houseIds});
			getHouses(houseIds, (req.query.raw ? 1 : 0), (req.query.specific ? 1 : 0), function (result) {
				if (result.status !== 'success'){
					return res.json(result);
				}
				var houses = result.houses;
				// console.log(houses[5]);
				for (var i = 0; i < houses.length; i++) {
					houses[i].rank = 0;
					
					// search in title
					var title = houses[i].title;
					if (title){

						// whole seach data - 
						title = title.myTrim().vi2en().toLowerCase();
						var match = title.indexOf(searchData);
						
						if ((match > -1)){
							houses[i].rank += WHOLE_SEARCH_MATCHED_RANK;
						}

						// single word
						var titles = title.match(REGEX_SINGLE_WORD);
						for (var j = 0; j < words.length; j++) {
							var match = titles.indexOf(words[j])
							if (match > -1){
								houses[i].rank += SINGLE_WORD_SEARCH_MATCHED_RANK;
							}
						}
					}
					

					// search in address
					var address = houses[i].address;
					if (address){

						// whole seach data - 
						address = address.myTrim().vi2en().toLowerCase();
						match = address.indexOf(searchData);
						
						if ((match > -1)){
							houses[i].rank += WHOLE_SEARCH_MATCHED_RANK;
						}

						// single word
						var addresses = address.match(REGEX_SINGLE_WORD);
						for (var j = 0; j < words.length; j++) {
							var match = addresses.indexOf(words[j])
							if (match > -1){
								houses[i].rank += SINGLE_WORD_SEARCH_MATCHED_RANK;
							}
						}
					}
					

					// search in formatted_address
					address = houses[i].formatted_address;
					if (address){

						// whole seach data - 
						address = address.myTrim().vi2en().toLowerCase();
						match = address.indexOf(searchData);
						// if ((match > -1) && (address.charCodeAt(match + searchData.length) == 32)){
						if ((match > -1)){
							houses[i].rank += WHOLE_SEARCH_MATCHED_RANK;
						}

						// single word
						addresses = address.match(REGEX_SINGLE_WORD);
						for (var j = 0; j < words.length; j++) {
							var match = addresses.indexOf(words[j])
							if (match > -1){
								houses[i].rank += SINGLE_WORD_SEARCH_MATCHED_RANK;
							}
						}
					}
					

				}
				houses = houses.filter(function (e) {
					return e.rank > 0;
				})

				houses.sort(function (a, b) {
					return b.rank - a.rank;
				})

				houses.map(function (e) {
					delete e.rank;
				})
				return res.status(200).json({
					status: 'success',
					houses: houses
				})
			})
		}
	)
})

/**
 * API for manager
 */
router.get('/house/:houseId/delete', isLoggedIn, function (req, res) {
	if (req.user.permission < CONST.PERMS.PERM_DELETE_HOUSE.perm){
		return res.status(403).json({
			status: 'error',
			error: 'You don\'t have permission to delete house'
		})
	}
	// console.log('http://' + req.headers.host + '/api/house/delete');
	request.post({
		url: 'http://' + req.headers.host + '/api/house/delete',
		form: {
			email: req.user.email,
			token: req.user.token,
			houseId: req.params.houseId
		}
	}, function (err, response, body) {
		if (err){
			console.log(err);
			return res.status(500).json({
				status: 'error',
				error: 'Error while deleting house'
			})
		}
		// console.log(response.statusCode);
		return res.status(200).json(JSON.parse(body));
	})
})

router.get('/house/:houseId/review/:state', isLoggedIn, function (req, res) {
	if (req.user.permission < CONST.PERMS.PERM_REVIEW_HOUSE.perm){
		return res.status(403).json({
			status: 'error',
			error: 'You don\'t have permission to review house'
		})
	}
	var hidden = 0;
	switch (req.params.state){
		case 'hide':
			hidden = 1;
			break;
		case 'show':
			hidden = 0;
			break;
		default:
			return res.status(400).json({
				status: 'error',
				error: 'Invalid value for state parameter'
			})
	}
	var houseId = parseInt(req.params.houseId);
	connection.query(
		'UPDATE houses SET hidden = ? WHERE id = ?',
		[hidden, houseId],
		function (err, result) {
			if (err){
				console.log(err);
				return res.status(500).json({
					status: 'error',
					error: 'Error while updating database'
				})
			}
			return res.status(200).json({
				status: 'success',
				houseId: houseId,
				newState: hidden ? 'hidden' : 'show'
			})
		}
	)
})

router.get('/estimate', function (req, res) {
	connection.query(
		'SELECT price.id, price.district, price.street, price.start_position, price.end_position, price.area_1_price, price.area_2_price, price.area_3_price, price.area_4_price, districts.districtName FROM `price` INNER JOIN districts WHERE price.district = districts.id',
		[],
		function (err, rows, fields) {
			if (err){
				return res.status(500).json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
			var result = {};
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var district = row.district;
				if (district in result){
					result[district].push(row)
				}
				else{
					result[district] = [row];
				}
			};
			res.status(200).json({
				status: 'success',
				data: result
			})
		}
	)
})

var ESTIMATE_RATE = 1.6;

router.post('/estimate', function (req, res) {
	var rb = req.body;
	var missingParam = checkRequiredParams(['street', 'frontend', 'area'], rb);
	if (missingParam){
		return responseMissing(missingParam, res);
	}
	var streetId = req.body.street;
	var type = 1;
	var rate = 1;
	if (('frontend' in rb) && (rb.frontend == 1)){
		type = 1;
		rate = 1;
	}
	else if ('deep' in rb){
		var deep = parseFloat(rb.deep);
		type = 4;
		rate = (deep >= 500) ? 0.85 : ((deep >= 300) ? 0.9 : ((deep >= 200) ? 0.95 : 1));
		if (deep < 200){
			var wide = parseFloat(rb.wide);
			type = (wide >= 3) ? 2 : ((wide >= 2) ? 3 : 4);
			rate = 1;
		}
	}
	else{
		return res.status(400).json({
			status: 'error',
			error: 'Missing info'
		})
	}
	connection.query(
		'SELECT * FROM price WHERE id = ?',
		[streetId],
		function (err, rows, fields) {
			if (!err && rows.length > 0){
				var price = rows[0];
				var p = Math.floor(price['area_' + type + '_price'] * parseFloat(rb.area) * rate * ESTIMATE_RATE);
				res.status(200).json({
					status: 'success',
					price: p,
				});
			}
			else{
				res.status(500).json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
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
	res.status(405).json({'status': 'error', 'error': 'Invalid API endpoint.'});
})

router.post('*', function (req, res) {
	res.status(405).json({'status': 'error', 'error': 'Invalid API endpoint.'});
})

router.put('*', function (req, res) {
	res.status(405).json({'status': 'error', 'error': 'Invalid API endpoint.'});
})

router.delete('*', function (req, res) {
	res.status(405).json({'status': 'error', 'error': 'Invalid API endpoint.'});
})

function checkRequiredParams (requiredParams, object) {
	if (requiredParams instanceof Array){
		for (var i = 0; i < requiredParams.length; i++) {
			if (!(requiredParams[i] in object)){
				return requiredParams[i];
			}
		}
	}
	return false;
}

function responseMissing (missingParam, res) {
	return res.status(400).json({
		status: 'error',
		error: 'Missing ' + missingParam
	})
}

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
	console.log('inside isLoggedIn');
	console.log(req.user);
	if ((req.isAuthenticated()) && (req.user.permission >= CONST.PERMS.PERM_ACCESS_MANAGE_PAGE.perm)){
		return next();
	}
	res.status(401).json({
		status: 'error',
		error: 'Unauthorized'
	});
}

module.exports = router;