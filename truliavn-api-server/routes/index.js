var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', { title: 'Express' });
});

router.get('/addhouse', function (req, res) {
	res.render('addhouse');
})

module.exports = router;
