var express = require('express');
var router = express.Router();
var request = require('request');
var passport = require("passport");
var CONST = require('../config/const.js');

/* GET home page. */
router.get('/', function(req, res) {
	if ((req.isAuthenticated()) && (req.user.permission >= CONST.PERM_ACCESS_MANAGE_PAGE)){
		res.redirect('/home');
	}
	res.render('index', { title: 'TruliaVN', loginMessage: req.flash('loginMessage') });
});

router.post('/login', passport.authenticate('local-login', {
	failureFlash: true,
	successRedirect: "home",
	failureRedirect: "/"
}));

router.get('/home', isLoggedIn, function (req, res) {
	res.end("hehe");
	console.log(req.user);
});

router.get('/logout', isLoggedIn, function (req, res) {
	req.logout();
	res.redirect('/');
})

function isLoggedIn (req, res, next) {
	console.log(req.headers);
	if ((req.isAuthenticated()) && (req.user.permission >= CONST.PERM_ACCESS_MANAGE_PAGE)){
		return next();
	}
	res.redirect("/");
}

module.exports = router;
