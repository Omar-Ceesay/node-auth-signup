var mongoose = require('mongoose');

var fileSchema = mongoose.Schema({
		length: Number,
		chunkSize: Number,
		uploadDate: Date,
		md5: String,
		filename: String
});

module.exports = mongoose.model('fs.files' /*THIS SHOULD BE THE COLLECTION NAME*/, fileSchema);
