var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', { title: 'Express' });
});

router.get('/addhouse', function (req, res) {
	res.render('addhouse');
})

router.get('/edithouse/:houseId', function (req, res) {
	request('http://localhost:3000/api/getfeatures', function (err, response, body) {
		if (!err && response.statusCode == 200){
			// res.json(JSON.parse(body).features);
			// return;
			res.render('edithouse', {features: JSON.parse(body).features, houseId: req.params.houseId});
		}
	})
})

module.exports = router;
