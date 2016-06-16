var express = require('express');
var router = express.Router();
var multer = require('multer');
var uploadImages = multer({dest: 'public/uploads/images'});
var mysql = require('mysql');
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '123123',
	database : 'truliavn'
});

connection.connect();

var HOUSE_TYPE_CHUNG_CU = 0;
var HOUSE_TYPE_NHA_RIENG = 1;
var HOUSE_TYPE = {
	0: 'Chung cu',
	1: 'Nha rieng'
}

var HOUSE_FOR_RENT = 0;
var HOUSE_FOR_SELL = 1;
var HOUSE_FOR = {
	0: 'Cho thue',
	1: 'Rao ban'
}

var HOUSE_STATUS_AVAILABLE = 0;
var HOUSE_STATUS_SELT_OR_RENTED = 1;
var HOUSE_STATUS = {
	0: 'Co san',
	1: 'Da thue hoac da ban'
}



/* API */
router.get('/', function(req, res) {
	res.json({'status': 'success'});
});

/**
 * Get information of a house
 *
 * @param {integer} houseId id of requested house
 * @query {integer} raw return data from database or preprocessed data.
 */
router.get('/house/:houseId', function (req, res) {
	connection.query(
		'SELECT * FROM Houses WHERE id = ?',
		[req.params.houseId],
		function (err, houses, fields) {
			if (err){
				console.log(err);
				res.json({
					status: 'error',
					error: 'Error while reading database'
				});
				return;
			}
			if (houses.length < 1){
				res.json({
					status: 'error',
					error: 'Invalid houseId'
				});
				return;
			}
			var house = houses[0];
			connection.query(
				'SELECT url FROM Images WHERE houseId = ?',
				[req.params.houseId],
				function (err, images, fields) {
					if (err){
						console.log(err);
						house.images = null;
					}
					house.images = [];
					for (var i = 0; i < images.length; i++) {
						house.images.push(images[i].url.substring("public/".length));
					}
					if (req.query.raw != '1'){
						house.type = HOUSE_TYPE[house.type];
						house.houseFor = HOUSE_FOR[house.houseFor];
						house.status = HOUSE_STATUS[house.status];
					}
					res.json({
						status: 'success',
						house: house
					});
				}
			)
			
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
							'(type, address, area, houseFor, noOfBedrooms, noOfBathrooms, ' + 
							'buildIn, price, ownerId, city, description, feePeriod) ' + 
							'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
			var rb = req.body;
			var values = [
				rb.type, rb.address.trim(), 
				parseFloat(rb.area) ? parseFloat(rb.area) : 0.0, 
				parseInt(rb.houseFor) ? parseInt(rb.houseFor) : 0, 
				parseInt(rb.noOfBedrooms) ? parseInt(rb.noOfBedrooms) : 1,
				parseInt(rb.noOfBathrooms) ? parseInt(rb.noOfBathrooms) : 1,
				parseInt(rb.buildIn) ? parseInt(rb.buildIn) : 2016, 
				parseInt(rb.price) ? parseInt(rb.price) : 0, userId, 
				rb.city ? rb.city : '', 
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
				console.log(req.files);
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
				
			});
		}
	)
})

/**
 * Delete a house
 *
 * request includes house's id and EMAIL + TOKEN of an authorized user.
 */

router.delete('/house', function (req, res) {
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
							})
						}
					)
				}
			)
		}
	)
})

/* debugging API */

router.get('/test', function (req, res) {
	connection.query('SELECT * FROM Users', function (err, rows, fields) {
		if (err){
			console.log(err);
			res.json({
				'status': 'error',
				'error': 'Error while reading database'
			});
			return;
		}
		console.log(rows);
		console.log(fields);
		res.json({
			status: 'success',
			rows: rows,
			fields: fields
		})
	});
})


// throw 404 for other endpoints
router.get('*', function (req, res) {
	res.json({'status': 'error', 'error': 'Invalid API endpoint.'});
})

module.exports = router;
