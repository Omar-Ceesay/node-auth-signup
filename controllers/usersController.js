var people = require('../app/models/user.js');

module.exports = {
  find: function(params, callback){
    people.find(params, function(err, peoples){
      if(err){
        callback(err, null)
        return
      }
      callback(null, peoples)
    })
  },
  findById: function(id, callback){
    people.findById(id, function(err, people){
      if(err){
        callback(err, null)
        return
      }

      callback(null, people)
    })
  },
  create: function(params, callback){
    people.create(params, function(err, zone){
      if(err){
        callback(err, null)
        return
      }
      callback(null, zone)
    })
  }
}
