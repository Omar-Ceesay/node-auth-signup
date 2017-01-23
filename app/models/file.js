var mongoose = require('mongoose');

var fileSchema = mongoose.Schema({
	localFile: {
		filename: String
	}
});

module.exports = mongoose.model('File', fileSchema);
