var bcrypt = require('bcrypt-nodejs');
var CryptoJS = require('crypto-js');

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
	var password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
	connection.query(
		'SELECT * FROM Users WHERE email = ?',
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

			var rb = req.body;
			var token = makeToken(rb.email);
			console.log(password);
			console.log(token);

			connection.query(
				'INSERT INTO Users (email, password, fullname, phone, address, token) VALUES (?, ?, ?, ?, ?, ?)',
				[rb.email, password, rb.fullname, rb.phone, rb.address, token],
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
							token: token
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
	connection.query(
		'SELECT * FROM Users WHERE email = ?',
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
				'UPDATE Users SET token = ? WHERE id = ?',
				[token, user.id],
				function (err, result) {

					// if err, use old token
					if (err){
						console.log(err);
						res.json({
							status: 'success',
							user: {
								email: user.email,
								fullname: user.fullname,
								token: user.token
							}
						});
					}
					else{
						res.json({
							status: 'success',
							user: {
								email: user.email,
								fullname: user.fullname,
								token: token
							}
						})
					}
				}
			)
			
		}
	)
})
};

function makeToken (email) {
	return CryptoJS.MD5(email + bcrypt.genSaltSync(100)).toString();
}