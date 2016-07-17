var request = require('request');
var fs = require('fs');

var mysql = require('mysql');
var connection = require('./database.js').MYSQL();

Array.prototype.indexOfObject = function(obj2) {
	for (var i = 0; i < this.length; i++) {
		if (this[i].myEqual(obj2)){
			return i;
		}
	}
	return -1;
}

Object.prototype.myEqual = function (obj2) {
	var obj1 = this;
	var keys1 = Object.keys(obj1)
	var keys2 = Object.keys(obj2)
	if (keys1.length != keys2.length){
		return false;
	}

	for (var i = 0; i < keys2.length; i++) {
		if (keys1.indexOf(keys2[i]) < 0){
			return false;
		}
	}

	for (var i = 0; i < keys2.length; i++) {
		var key = keys2[i];
		if (typeof(obj1[key].valueOf()) !== typeof(obj2[key].valueOf())){
			return false;
		}
		if (typeof(obj1[key].valueOf()) == 'string'){
			if (obj1[key].valueOf() !== obj2[key].valueOf()){
				// console.log('f: ' + obj1[key].valueOf() + " : " + obj2[key].valueOf());
				return false;
			}
			else{
				if (obj1[key].valueOf().toLowerCase() !== obj2[key].valueOf().toLowerCase()){
					// console.log('f: ' + obj1[key].valueOf() + " : " + obj2[key].valueOf());
					return false;
				}
			}
		}
		else{
			if (obj1[key].valueOf() !== obj2[key].valueOf()){
				// console.log('f: ' + obj1[key].valueOf() + " : " + obj2[key].valueOf());
				return false;
			}
		}
		
	}

	return true;

}

var houses = JSON.parse(fs.readFileSync('data.json'));
var owners = JSON.parse(fs.readFileSync('owners.json'));
var ownersWithoutId = JSON.parse(JSON.stringify(owners));
for (var i = 0; i < ownersWithoutId.length; i++) {
	delete ownersWithoutId[i].id;
}

insertHouse(0);

function insertHouse(index) {
	console.log('start inserting: ' + index);
	if (index >= houses.length){
		console.log('finishing...');
		fs.writeFileSync('data.json', JSON.stringify(houses, null, 4));
		connection.end();
		return;
	}
	var house = houses[index];
	// console.log(house);
	var crawledOwnerId = owners[ownersWithoutId.indexOfObject(house.owner)].id;
	if (crawledOwnerId < 0){
		console.log('house[' + index + ']: unknown owner.' );
	}
	else{
		if (!house.hasOwnProperty('id')){
			connection.query(
				'INSERT INTO houses (type, title, crawledFrom, address, area, houseFor, lat, lon, noOfBedrooms, noOfBathrooms, noOfFloors, interior, buildIn, price, ownerId, crawledOwnerId, city, district, ward, status, description, feePeriod, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
				[
					parseInt(house.type), house.title, house.bdsUrl, house.address, parseFloat(house.area) ? parseFloat(house.area) : 0.0, parseInt(house.houseFor), parseFloat(house.lat) ? parseFloat(house.lat) : 0.0, parseFloat(house.lon) ? parseFloat(house.lon) : 0.0,
					parseInt(house.bedrooms) ? parseInt(house.bedrooms) : 0, parseInt(house.bathrooms) ? parseInt(house.bathrooms) : 0, parseInt(house.floors) ? parseInt(house.floors) : 0, house.interior, 0, parseInt(house.price) ? parseInt(house.price) : 0, -1, crawledOwnerId, parseInt(house.city), parseInt(house.district), parseInt(house.ward), 0, house.description, 1, (new Date())
				],
				function (err, result) {
					if (err){
						console.log(err);
						insertHouse(index + 1);
					}
					else{
						house.id = result.insertId;
						if (house.images.length > 0){
							sqlQuery = 'INSERT INTO images (houseId, url) VALUES ';

							for (var i = 0; i < house.images.length; i++) {
								sqlQuery += '("' + house.id + '", "' + house.images[i] + '"),';
							}
							sqlQuery = sqlQuery.substring(0, sqlQuery.length - 1);
							connection.query(sqlQuery, [], function (err, result) {
								if (err){
									console.log(err);
								}
								insertHouse(index + 1);
							});
						}
						else{
							insertHouse(index + 1);
						}
					}
				}
			)
		}
		else{
			insertHouse(index + 1);
		}
	}
}