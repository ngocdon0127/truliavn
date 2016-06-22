var request = require('request');
var fs = require('fs');

var data = JSON.parse(fs.readFileSync('batdongsan1.json'));

request.post('http://batdongsan.com.vn/HandlerWeb/redirect.ashx?IsMainSearch=true', {
	form: {
		'cboCity': "HN",
		cboCategory: 49,
		cboDistrict: 2,
		// cboWard: data.wards[841].bdsWardId,
		cboWard: 0,
		cboArea: -1,
		cboPrice: -1,
		cboBedRoom: -1,
		cboHomeDirection: -1
	}
}, function (err, response, body) {
	if (err){
		console.log(err);
		return;
	}
	console.log(response.headers);
})