var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	local: {
		username: String,
		password: String,
		email: String,
		name: String
	}
});

module.exports = mongoose.model('User', userSchema);
