var file = require('../app/models/file');

module.exports = {
  find: function(params, callback){
    file.find(params, function(err, files){
      if(err){
        callback(err, null)
        return
      }
      callback(null, files)
    })
  }
}
