var request = require('request');

request.post('http://batdongsan.com.vn/HandlerWeb/redirect.ashx?IsMainSearch=true', {
	form: {
		'cboCity': "HN",
		cboCategory: 49,
		cboDistrict:4,
		cboWard:85,
		cboArea: -1,
		cboPrice: -1,
		cboBedRoom: -1,
		cboHomeDirection: -1,
		hdCboProject: 5,
		hdCboCatagoryRe: 6,
		cboStreet: 7
	}
}, function (err, response, body) {
	if (err){
		console.log(err);
		return;
	}
	console.log(response.headers);
})