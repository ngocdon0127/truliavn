var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');

module.exports = function (passport, connection) {
	passport.serializeUser(function (user, done) {
		done(null, user.id)
	});

	passport.deserializeUser(function (id, done) {
		connection.query(
			'SELECT id, email FROM users WHERE id = ?',
			[id],
			function (err, rows, fields) {
				if (rows.length < 1){
					done(err, null);
				}
				else{
					done(err, rows[0]);
				}
			}
		)
	})

	passport.use('local-login', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	}, function (req, username, password, done) {
		connection.query(
			'SELECT * FROM users WHERE email = ?',
			[username],
			function (err, rows, fields) {
				if (err || rows.length < 1){
					return done(err, false)
				}
				if (!bcrypt.compareSync(req.body.password, rows[0].password)){
					return done(null, false)
				}
				return done(null, rows[0]);
			}
		)
	}))
}