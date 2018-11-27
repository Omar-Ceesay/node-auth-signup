var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
		body: String,
		uploadDate: String,
		user: String
});

module.exports = mongoose.model('messages' /*THIS SHOULD BE THE COLLECTION NAME*/, messageSchema);
