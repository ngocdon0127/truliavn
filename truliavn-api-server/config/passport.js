var LocalStrategy = require('passport-local').Strategy;

module.exports = function (passport, connection) {
	passport.serializeUser(function (user, done) {
		done(null, user.id)
	});

	passport.deserializeUser(function (id, done) {
		connection.query(
			'SELECT id, email, '
		)
	})
}