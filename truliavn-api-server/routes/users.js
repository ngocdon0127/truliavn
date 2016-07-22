var bcrypt = require('bcrypt-nodejs');
var CryptoJS = require('crypto-js');
var validator = require('validator');
var CONST = require('../config/const.js');

module.exports = function (router, connection, uploadImages) {

/**
 * ======================
 *
 * API for User operation
 *
 * ======================
 */

/**
 * Register
 */
router.post('/register', uploadImages.single('photo'), function (req, res) {
	console.log(req.body);
	var rb = req.body;
	var password = rb.password;
	var repeatPassword = rb.repeatPassword;
	console.log(password);
	console.log(repeatPassword);
	if (!validator.isEmail(rb.email)){
		res.status(400).json({
			status: 'error',
			error: 'Invalid email'
		})
		return;
	}
	if (!validator.isLength(rb.password + '', {min: 6, max: 30})){
		res.status(400).json({
			status: 'error',
			error: 'Password length must greater than 5 and less than 31'
		})
		return;
	}
	if (password.localeCompare(repeatPassword) !== 0){
		res.status(400).json({
			status: 'error',
			error: 'Password not match'
		})
		return
	}

	password = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
	connection.query(
		'SELECT * FROM users WHERE email = ?',
		[req.body.email],
		function (err, users, fields) {
			if (err){
				res.status(500).json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
			if (users.length > 0){
				res.status(400).json({
					status: "error",
					error: 'User has already existed'
				});
				return;
			}

			var token = makeToken(rb.email);

			console.log(token);

			connection.query(
				'INSERT INTO users (email, password, gender, status, fullname, phone, address, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
				[rb.email, password, (rb.gender) ? true : false, true, rb.fullname, rb.phone, rb.address, token],
				function (error, result) {
					if (error){
						console.log(error);
						res.status(500).json({
							status: 'error',
							error: 'Error while writing on database'
						});
						return
					}
					res.status(200).json({
						status: 'success',
						user: {
							email: rb.email,
							fullname: rb.fullname,
							gender: (rb.gender) ? true : false,
							status: true,
							token: token
						}
					})

				}
			)

		}
	)
})

/**
 * Get user info - GET
 */
router.get('/user/:userId', uploadImages.single('photo'), function (req, res) {
	// res.status(200).json({
		// console.log({session: req.session});
		// console.log({user: req.user});
		// console.log({headers: req.headers});
	// })
	// return;
	connection.query(
		'SELECT * FROM users WHERE id = ?',
		[req.params.userId],
		function (err, users, fields) {
			if (err || users.length < 1){
				return res.status(200).json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
			var user = users[0];
			delete user.password;
			delete user.token;
			return res.status(200).json({
				status: 'success',
				user: user
			})
		}
	)
})


/**
 * Update user info - POST
 */
router.post('/user/edit', uploadImages.single('photo'), function (req, res) {
	console.log(req.body);
	var rb = req.body;
	var oldPassword = rb.oldPassword;
	var newPassword = rb.newPassword;
	var repeatPassword = rb.repeatPassword;
	var userId = rb.userId;
	console.log(newPassword);
	console.log(repeatPassword);
	console.log(parseInt(userId));
	connection.query(
		'SELECT email, password FROM users WHERE id = ?',
		[parseInt(userId)],
		function (err, users, fields) {
			if (err){
				console.log(err);
				return res.status(500).json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
			if (users.length < 1){
				return res.status(400).json({
					status: 'error',
					error: 'Invalid userId'
				});
			}
			var user = users[0];
			// console.log(user);
			if (!bcrypt.compareSync(oldPassword, user.password)){
				return res.status(200).json({
					status: 'error',
					error: 'Wrong password'
				})
			}

			var sqlQuery = 'UPDATE users SET status = ?, ';
			var queryBuilderData = [true];
			if (rb.fullname){
				sqlQuery += 'fullname = ?, ';
				queryBuilderData.push(rb.fullname);
			}
			if (rb.phone){
				if (!validator.isMobilePhone(rb.phone, 'vi-VN')){
					return res.status(200).json({
						status: 'error',
						error: 'Invalid phone number'
					})
				}
				sqlQuery += 'phone = ?, ';
				queryBuilderData.push(rb.phone);
			}

			if (rb.address){
				sqlQuery += 'address = ?, ';
				queryBuilderData.push(rb.address);
			}
			if (newPassword && newPassword.length > 0){
				console.log('checking new password');
				// check new password
				if (!validator.isLength(newPassword + '', {min: 6, max: 30})){
					res.status(400).json({
						status: 'error',
						error: 'Password length must greater than 5 and less than 31'
					})
					return;
				}
				if (newPassword.localeCompare(repeatPassword) !== 0){
					res.status(400).json({
						status: 'error',
						error: 'Password not match'
					})
					return;
				}
				console.log('done new password');

				newPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(8), null);
				sqlQuery += 'password = ?, ';
				queryBuilderData.push(newPassword);
			}
			var token = makeToken(user.email);
			sqlQuery += 'token = ? WHERE id = ?';
			queryBuilderData.push(token, userId);

			connection.query(
				sqlQuery,
				queryBuilderData,
				function (error, result) {
					if (error){
						console.log(error);
						return res.status(200).json({
							status: 'error',
							error: 'Error while writing on database'
						});
					}
					return res.status(200).json({
						status: 'success',
						user: {
							id: userId,
							email: user.email,
							fullname: rb.fullname ? rb.fullname : user.fullname,
							status: true,
							token: token,
							address: rb.address ? rb.address : user.address,
							phone: rb.phone ? rb.phone : user.phone
						}
					})

				}
			)

		}
	)
	
})

/**
 * Login
 */
router.post('/login', uploadImages.single('photo'), function (req, res) {
	console.log(req.headers);
	connection.query(
		'SELECT * FROM users WHERE email = ?',
		[req.body.email],
		function (err, users, fields) {
			if (err){
				console.log(err);
				res.status(500).json({
					status: 'error',
					error: 'Error while reading database'
				});
				return
			}
			if (users.length < 1){
				res.status(400).json({
					status: 'error',
					error: 'Invalid email'
				});
				return;
			}
			var user = users[0];
			if (!bcrypt.compareSync(req.body.password, user.password)){
				res.status(400).json({
					status: 'error',
					error: 'Invalid password'
				});

			}
			var token = makeToken(user.email);
			// renew token
			connection.query(
				'UPDATE users SET token = ?, status = ? WHERE id = ?',
				[token, true, user.id],
				function (err, result) {

					// if err, use old token
					if (err){
						console.log(err);
						res.status(200).json({
							status: 'success',
							user: {
								id: user.id,
								email: user.email,
								fullname: user.fullname,
								gender: user.gender,
								status: true,
								phone: user.phone,
								address: user.address,
								token: user.token,
							}
						});
					}
					else{
						res.status(200).json({
							status: 'success',
							user: {
								id: user.id,
								email: user.email,
								fullname: user.fullname,
								gender: user.gender,
								status: true,
								phone: user.phone,
								address: user.address,
								token: token
							}
						})
					}
				}
			)
			
		}
	)
})

router.post('/userstatus', uploadImages.single('photo'), function (req, res) {
	var email = req.body.email;
	if (!validator.isEmail(email)){
		res.status(200).json({
			status: 'error',
			error: 'Invalid Email'
		})
		return
	}
	connection.query(
		'SELECT status FROM users WHERE email = ?',
		[email],
		function (err, rows, fields) {
			if (err){
				res.status(200).json({
					status: 'error',
					error: 'Error while reading database'
				})
				return
			}
			if (rows.length < 1){
				res.status(200).json({
					status: 'error',
					error: 'This email is not exist'
				})
				return
			}
			res.status(200).json({
				status: 'success',
				email: email,
				status: rows[0].status
			})
		}
	)
})

router.post('/logout', uploadImages.single('photo'), function (req, res) {
	var email = req.body.email;
	var oldToken = req.body.token;
	connection.query(
		'SELECT * FROM users WHERE email = ? AND token = ?',
		[email, oldToken],
		function (err, users, fields) {
			if (err || users.length < 1){
				res.status(400).json({
					status: 'error',
					error: 'Invalid email and token'
				})
				return;
			}
			connection.query(
				'UPDATE users SET token = ?, status = ? WHERE id = ?',
				[makeToken(email), false, users[0].id],
				function (err, result) {
					if (err){
						res.status(500).json({
							status: 'error',
							error: 'Error while updating database'
						})
						return;
					}
					req.logout();
					res.status(200).json({
						status: 'success'
					});
				}
			)
		}
	)
})

router.get('/user/:userId/delete', isLoggedIn, function (req, res) {
	if (req.user.permission < CONST.PERM_DELETE_ACCOUNT){
		return res.status(403).json({
			status: 'error',
			error: 'You don\'t have permission to delete user account'
		})
	}
	var userId = parseInt(req.params.userId);
	if (userId < 1){
		return res.status(400).json({
			status: 'error',
			error: 'Invalid user id'
		})
	}
	connection.query(
		'SELECT * FROM users WHERE id = ?',
		[userId],
		function (err, users, fields) {
			if (err){
				return res.status(500).json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
			if (users.length < 1){
				return res.status(400).json({
					status: 'error',
					error: 'Invalid user id'
				})
			}
			var user = users[0];
			if (req.user.permission <= user.permission){
				return res.status(403).json({
					status: 'error',
					error: 'You don\'t have permission to delete this account'
				})
			}
			connection.query(
				'DELETE FROM users WHERE id = ?',
				[userId],
				function (err, result) {
					if (err){
						return res.status(500).json({
							status: 'error',
							error: 'Error while deleting user'
						})
					}
					return res.status(200).json({
						status: 'success'
					})
				}
			)
		}
	)
})

/**
 * API for manager
 */
router.get('/allusers', isLoggedIn, function (req, res) {
	connection.query(
		'SELECT id, fullname, email, permission FROM users',
		[],
		function (err, users, fields) {
			if (err){
				return res.status(500).json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
			return res.status(200).json({
				status: 'success',
				users: users
			})
		}
	)
})

};

function makeToken (email) {
	return CryptoJS.MD5(email + bcrypt.genSaltSync(100)).toString();
}

function isLoggedIn (req, res, next) {
	console.log('inside isLoggedIn');
	console.log(req.user);
	if ((req.isAuthenticated()) && (req.user.permission >= CONST.PERM_ACCESS_MANAGE_PAGE)){
		return next();
	}
	res.status(401).json({
		status: 'error',
		error: 'Unauthorized'
	});
}