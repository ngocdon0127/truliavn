var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var mysql = require('mysql');
var MYSQL = require('./database.js').MYSQL;

var connection = MYSQL();

var data = JSON.parse(fs.readFileSync('batdongsan1.json'));

var districts = data.districts;
var wards = data.wards;

var d = "";

for (i in districts){
	d += "UPDATE districts SET bdsDistrictId = " + districts[i].bdsDistrictId + " WHERE id = " + i + ";\n";
}

var w = "";

for (i in wards){
	w += "UPDATE wards SET bdsWardId = " + wards[i].bdsWardId + " WHERE id = " + i + ";\n";
}

fs.writeFileSync('sql.sql', d + w);
console.log('done');
