var connection = require('../database.js').MYSQL();
var fs = require('fs');
var filename = './Don/tayho.txt';
var districtId = 24;
var seperator = ';';
var run = !false;

String.prototype.myTrim = function() {
	var s = this.trim();
	s = s.replace(/\r+\n+/g, ' ');
	s = s.replace(/ {2,}/g, ' ');
	return s;
}

var data = fs.readFileSync(filename).toString().split('\r\n');
if (!run){
	console.log(data);
}
else{
	var total = data.length;
	var cur = 0;

	var interval = setInterval(function () {
		if (cur >= total){
			clearInterval(interval);
			connection.end();
		}
	}, 1000);

	for (var i = 0; i < data.length; i++) {
		var row = data[i].myTrim();
		// console.log(row);
		var values = row.split(seperator);
		values.unshift(districtId);
		if (values.length === 8){
			// console.log(values);
			connection.query(
				'INSERT INTO price (district, street, start_position, end_position, area_1_price, area_2_price, area_3_price, area_4_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
				values,
				function (err, result) {
					if (err){
						cur++;
						return console.log(err);
					}
					console.log('insertId: ' + result.insertId);
					cur++;
				}
			)
		}
	}
}
