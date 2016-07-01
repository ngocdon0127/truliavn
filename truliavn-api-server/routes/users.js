var bcrypt = require('bcrypt-nodejs');
var CryptoJS = require('crypto-js');
var validator = require('validator');

module.exports = function (router, connection, uploadImages, passport) {

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
		res.json({
			status: 'error',
			error: 'Invalid email'
		})
		return;
	}
	if (!validator.isLength(rb.password + '', {min: 6, max: 30})){
		res.json({
			status: 'error',
			error: 'Password length must greater than 5 and less than 31'
		})
		return;
	}
	if (password.localeCompare(repeatPassword) !== 0){
		res.json({
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
				res.json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
			if (users.length > 0){
				res.json({
					status: "error",
					error: 'User has already existed'
				});
				return;
			}

			var token = makeToken(rb.email);

			console.log(token);

			connection.query(
				'INSERT INTO users (email, password, status, fullname, phone, address, token) VALUES (?, ?, ?, ?, ?, ?, ?)',
				[rb.email, password, true, rb.fullname, rb.phone, rb.address, token],
				function (error, result) {
					if (error){
						console.log(error);
						res.json({
							status: 'error',
							error: 'Error while writing on database'
						});
						return
					}
					res.json({
						status: 'success',
						user: {
							email: rb.email,
							fullname: rb.fullname,
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
 * Update user info - GET
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
			if (err || users.length < 1){
				console.log(err);
				return res.status(200).json({
					status: 'error',
					error: 'Error while reading database'
				})
			}
			var user = users[0];
			// console.log(user);
			if (!bcrypt.compareSync(oldPassword, user.password)){
				return res.status(200).json({
					status: 'error',
					error: 'Wrong password'
				})
			}
			console.log('checking new password');
			// check new password
			if (!validator.isLength(newPassword + '', {min: 6, max: 30})){
				res.json({
					status: 'error',
					error: 'Password length must greater than 5 and less than 31'
				})
				return;
			}
			if (newPassword.localeCompare(repeatPassword) !== 0){
				res.json({
					status: 'error',
					error: 'Password not match'
				})
				return
			}
			console.log('done new password');

			if (!validator.isMobilePhone(rb.phone, 'vi-VN')){
				return res.status(200).json({
					status: 'error',
					error: 'Invalid phone number'
				})
			}

			newPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(8), null);
			var token = makeToken(user.email);

			console.log(token);

			connection.query(
				'UPDATE users SET password = ?, status = ?, fullname = ?, phone = ?, address = ?, token = ? WHERE id = ?',
				[newPassword, true, rb.fullname, rb.phone, rb.address, token, parseInt(userId)],
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
							email: user.email,
							fullname: rb.fullname,
							status: true,
							token: token,
							address: rb.address
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
router.post('/login', uploadImages.single('photo'), passport.authenticate('local-login', {
	failureFlash: true
}), function (req, res) {
	console.log(req.headers);
	connection.query(
		'SELECT * FROM users WHERE email = ?',
		[req.body.email],
		function (err, users, fields) {
			if (err){
				console.log(err);
				res.json({
					status: 'error',
					error: 'Error while reading database'
				});
				return
			}
			if (users.length < 1){
				res.json({
					status: 'error',
					error: 'Invalid email'
				});
				return;
			}
			var user = users[0];
			if (!bcrypt.compareSync(req.body.password, user.password)){
				res.json({
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
						res.json({
							status: 'success',
							user: {
								id: user.id,
								email: user.email,
								fullname: user.fullname,
								status: true,
								token: user.token
							}
						});
					}
					else{
						res.json({
							status: 'success',
							user: {
								id: user.id,
								email: user.email,
								fullname: user.fullname,
								status: true,
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
				res.json({
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
						res.json({
							status: 'error',
							error: 'Error while updating database'
						})
						return;
					}
					req.logout();
					res.json({
						status: 'success'
					});
				}
			)
		}
	)
})
};

function makeToken (email) {
	return CryptoJS.MD5(email + bcrypt.genSaltSync(100)).toString();
}

function isLoggedIn (req, res, next) {
	console.log('inside isLoggedIn');
	console.log(req.headers);
	if (req.isAuthenticated()){
		return next();
	}
	res.status(401).json({
		status: 'error',
		error: 'Unauthorized'
	});
}