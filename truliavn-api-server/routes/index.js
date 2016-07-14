var express = require('express');
var router = express.Router();
var request = require('request');
var passport = require("passport");

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', { title: 'TruliaVN' });
});

router.post('/login', passport.authenticate('local-login', {
	failureFlash: true,
	successRedirect: "home",
	failureRedirect: "/"
}));

router.get('/home', isLoggedIn, function (req, res) {
	res.end("hehe");
});

router.get('/logout', isLoggedIn, function (req, res) {
	req.logout();
	res.redirect('/');
})

function isLoggedIn (req, res, next) {
	if (req.isAuthenticated()){
		return next();
	}
	res.redirect("/");
}

module.exports = router;
