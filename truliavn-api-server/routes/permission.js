var fs = require('fs');
// var CONST = require('../config/const.js');
var CONST = JSON.parse(fs.readFileSync(__dirname + '/../config/const.json'));


String.prototype.myTrim = function() {
	var s = this.trim();
	s = s.replace(/\r+\n+/g, ' ');
	s = s.replace(/ {2,}/g, ' ');
	return s;
}

String.prototype.vi2en = function() {
	var str = this.myTrim();
	str= str.toLowerCase(); 
	str= str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a"); 
	str= str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e"); 
	str= str.replace(/ì|í|ị|ỉ|ĩ/g, "i"); 
	str= str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o"); 
	str= str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u"); 
	str= str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y"); 
	str= str.replace(/đ/g, "d"); 
	return str;
}

module.exports = function (router, connection) {

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

router.post('/permission/addrole', isLoggedIn, function (req, res, next) {
	var rb = req.body;
	if (!('position' in rb) || !('name' in rb)){
		return res.status(400).json({
			status: 'error',
			error: 'Missing arguments'
		})
	}
	var ROLES = CONST.ROLES;
	var position = parseInt(rb.position);
	var name = rb.name.vi2en().myTrim().toUpperCase();
	if ((position < 0) || (position >= ROLES.length - 1)){
		return res.status(400).json({
			status: 'error',
			error: 'Invalid position'
		})
	}
	for (var i = 0; i < ROLES.length; i++) {
		var role = ROLES[i];
		if (role.name.localeCompare(name) == 0){
			return res.status(400).json({
				status: 'error',
				error: 'This role name is already taken'
			})
		}
	}
	var newRole = {};
	newRole.name = name;
	newRole.perm = Math.floor((ROLES[position].perm + ROLES[position + 1].perm ) / 2);
	if ((newRole.perm == ROLES[position].perm) || (newRole.perm == ROLES[position + 1].perm)){
		return res.status(400).json({
			status: 'error',
			error: 'Cannot create new role in that position'
		})
	}
	ROLES.push(newRole);
	restart(res);
})

router.post('/permission/deleterole', isLoggedIn, function (req, res, next) {
	var rb = req.body;
	var position = parseInt(rb.position);
	var ROLES = CONST.ROLES;
	if (!position || (position < 0) || (position >= ROLES.length - 1)){
		return res.status(400).json({
			status: 'error',
			error: 'Invalid position'
		})
	}
	var perm = ROLES[position].perm;
	var newPerm = ROLES[position - 1].perm;
	var PERMS = CONST.PERMS;
	for(var i in PERMS){
		(PERMS[i].perm == perm) && (PERMS[i].perm = newPerm);
	}
	var newUserPerm = ROLES[position + 1].perm;
	ROLES.splice(position, 1);
	connection.query(
		'UPDATE users SET permission = ? WHERE permission = ?',
		[newUserPerm, perm],
		function (err, result) {
			if (err){
				console.log(err);
			}
			return restart(res);
		}
	)
	
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