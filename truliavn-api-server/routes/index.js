var express = require('express');
var router = express.Router();
var request = require('request');
var passport = require("passport");
var fs = require('fs');
// var CONST = require('../config/const.js');
var CONST = JSON.parse(fs.readFileSync(__dirname + '/../config/const.json'));
var connection = require('../config/database.js').MYSQL();

router.get('/test', function (req, res) {
	res.render('test');
})

/* GET home page. */
router.get('/', function(req, res) {
	if ((req.isAuthenticated()) && (req.user.permission >= CONST.PERMS.PERM_ACCESS_MANAGE_PAGE.perm)){
		res.redirect('/users');
	}
	res.render('index', { title: 'TruliaVN', loginMessage: req.flash('loginMessage') });
});

router.post('/login', passport.authenticate('local-login', {
	failureFlash: true,
	successRedirect: "/users",
	failureRedirect: "/"
}));

router.get('/users', isLoggedIn(CONST.PERMS.PERM_ACCESS_MANAGE_PAGE.perm), function (req, res) {
	res.render('users', {
		fullname: req.user.fullname,
		path: req.path,
		displayConfigMenu: (req.user.permission >= CONST.PERMS.PERM_MASTER.perm)
	})
});

router.get('/houses', isLoggedIn(CONST.PERMS.PERM_ACCESS_MANAGE_PAGE.perm), function (req, res) {
	res.render('houses', {
		fullname: req.user.fullname,
		path: req.path,
		email: req.user.email,
		token: req.user.token,
		displayConfigMenu: (req.user.permission >= CONST.PERMS.PERM_MASTER.perm)
	})
});

router.get('/estimate', function (req, res) {
	res.render('estimate');
})

router.get('/config', isLoggedIn(CONST.PERMS.PERM_MASTER.perm), function (req, res, next) {
	var consts = JSON.parse(JSON.stringify(CONST));
	delete consts.PERMS.PERM_MASTER;
	res.render('config', {
		fullname: req.user.fullname,
		path: req.path,
		email: req.user.email,
		token: req.user.token,
		displayConfigMenu: (req.user.permission >= CONST.PERMS.PERM_MASTER.perm),
		CONST: consts
	})
})

router.get('/logout', isLoggedIn(CONST.PERMS.PERM_ACCESS_MANAGE_PAGE.perm), function (req, res) {
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
