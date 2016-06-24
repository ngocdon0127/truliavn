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

var houses = JSON.parse(fs.readFileSync('data.json'));
var owners = JSON.parse(fs.readFileSync('owners.json'));
// var owners = [];

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

var newOwner = 0;

for (var i = 0; i < houses.length; i++) {
	if (owners.indexOfObject(houses[i].owner) < 0){
		owners.push(houses[i].owner);
		newOwner++;
		console.log('pushed');
	}
}

console.log(houses.length);
console.log(owners.length);
// console.log(owners);
fs.writeFileSync('owners.json', JSON.stringify(owners, null, 4));
console.log('new Owner: ' + newOwner);

insertOwner(0);

function insertOwner (index) {
	if (index >= owners.length){
		fs.writeFileSync('owners.json', JSON.stringify(owners, null, 4));
		connection.end();
		return;
	}
	var owner = owners[index];
	if (!owner.hasOwnProperty('id')){
		connection.query(
			'INSERT INTO owners (fullname, mobile, phone, address, email) VALUES (?, ?, ?, ?, ?)',
			[owner.fullname, owner.mobile, owner.phone, owner.address, owner.email],
			function (err, result) {
				if (err){
					console.log(err);
				}
				else{
					owner.id = result.insertId;
					console.log(owner.mobile + ' : ' + result.insertId);
				}
				insertOwner(index + 1);
			}
		)
	}
}