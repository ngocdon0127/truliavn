var fs = require('fs');
// var CONST = require('../config/const.js');
var CONST = JSON.parse(fs.readFileSync(__dirname + '/../config/const.json'));

module.exports = function (router) {

router.get('/permission/:action/:minPerm', isLoggedIn, function (req, res, next) {
	switch (req.params.action){
		case 'access':
			CONST.PERMS.PERM_ACCESS_MANAGE_PAGE = parseInt(req.params.minPerm);
			restart(res);
			break;
		case 'delete-house':
			CONST.PERMS.PERM_DELETE_HOUSE = parseInt(req.params.minPerm);
			restart(res);
			break;
		case 'delete-account':
			CONST.PERMS.PERM_DELETE_ACCOUNT = parseInt(req.params.minPerm);
			restart(res);
			break;
		case 'change-perm':
			CONST.PERMS.PERM_CHANGE_PERM = parseInt(req.params.minPerm);
			restart(res);
			break;
		case 'review-house':
			CONST.PERMS.PERM_HIDE_HOUSE = parseInt(req.params.minPerm);
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
	if ((req.isAuthenticated()) && (req.user.permission >= CONST.PERMS.PERM_MASTER)){
		return next();
	}
	res.status(401).json({
		status: 'error',
		error: 'You do not have permission to access this page'
	});
}

function restart (res) {
	fs.writeFileSync(__dirname + '/../config/const.json', JSON.stringify(CONST, null, 4));
	res.status(200).json({
		status: 'success'
	});
	setTimeout(function () {
		console.log('halt');
		process.exit(0);
	}, 1000)
}