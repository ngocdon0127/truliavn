var fs = require('fs');
// var CONST = require('../config/const.js');
var CONST = JSON.parse(fs.readFileSync(__dirname + '/../config/const.json'));

module.exports = function (router) {

router.get('/permissions', isLoggedIn, function (req, res) {
	return res.status(200).json(CONST);
})

router.get('/permission/:action/:minPerm', isLoggedIn, function (req, res, next) {
	switch (req.params.action){
		case 'access':
			CONST.PERMS.PERM_ACCESS_MANAGE_PAGE.perm = parseInt(req.params.minPerm);
			restart(res);
			break;
		case 'delete-house':
			CONST.PERMS.PERM_DELETE_HOUSE.perm = parseInt(req.params.minPerm);
			restart(res);
			break;
		case 'delete-account':
			CONST.PERMS.PERM_DELETE_ACCOUNT.perm = parseInt(req.params.minPerm);
			restart(res);
			break;
		case 'change-perm':
			CONST.PERMS.PERM_CHANGE_PERM.perm = parseInt(req.params.minPerm);
			restart(res);
			break;
		case 'review-house':
			CONST.PERMS.PERM_REVIEW_HOUSE.perm = parseInt(req.params.minPerm);
			restart(res);
			break;
		default:
			res.status(400).json({
				status: 'error',
				error: 'Invalid enpoint'
			})
	}
})

}

function isLoggedIn (req, res, next) {
	console.log('inside isLoggedIn');
	console.log(req.user);
	if ((req.isAuthenticated()) && (req.user.permission >= CONST.PERMS.PERM_MASTER.perm)){
		return next();
	}
	res.status(401).json({
		status: 'error',
		error: 'You do not have permission to access this page'
	});
}

function restart (res) {
	CONST.ROLES.sort(function (a, b) {
		return b.perm - a.perm;
	});
	fs.writeFileSync(__dirname + '/../config/const.json', JSON.stringify(CONST, null, 4));
	res.status(200).json({
		status: 'success'
	});
	setTimeout(function () {
		console.log('halt');
		process.exit(0);
	}, 1000)
}