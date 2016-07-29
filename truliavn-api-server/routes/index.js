var express = require('express');
var router = express.Router();
var request = require('request');
var passport = require("passport");
var CONST = require('../config/const.js');
var connection = require('../config/database.js').MYSQL();

router.get('/test', function (req, res) {
	res.render('test');
})

/* GET home page. */
router.get('/', function(req, res) {
	if ((req.isAuthenticated()) && (req.user.permission >= CONST.PERMS.PERM_ACCESS_MANAGE_PAGE)){
		res.redirect('/users');
	}
	res.render('index', { title: 'TruliaVN', loginMessage: req.flash('loginMessage') });
});

router.post('/login', passport.authenticate('local-login', {
	failureFlash: true,
	successRedirect: "/users",
	failureRedirect: "/"
}));

router.get('/users', isLoggedIn(CONST.PERMS.PERM_ACCESS_MANAGE_PAGE), function (req, res) {
	res.render('users', {
		fullname: req.user.fullname,
		path: req.path
	})
});

router.get('/houses', isLoggedIn(CONST.PERMS.PERM_ACCESS_MANAGE_PAGE), function (req, res) {
	res.render('houses', {
		fullname: req.user.fullname,
		path: req.path,
		email: req.user.email,
		token: req.user.token
	})
});

router.get('/config', isLoggedIn(1000), function (req, res) {
	res.status(200).json({status: 'building'})
})

router.get('/estimate', function (req, res) {
	res.render('estimate');
})

router.get('/logout', isLoggedIn(CONST.PERMS.PERM_ACCESS_MANAGE_PAGE), function (req, res) {
	req.logout();
	res.redirect('/');
})

function isLoggedIn (permission, redirectUrl) {
	return function (req, res, next) {
		// console.log(req.headers);
		if ((req.isAuthenticated()) && (req.user.permission >= permission)){
			if (redirectUrl){
				return res.redirect(redirectUrl);
			}
			return next();
		}
		res.redirect("/");
	}
}

module.exports = router;
