var User = require('./models/user');
var Message = require('./models/message');
var mongo = require('mongodb');
var dbUrl = process.env.dbUrl || 'mongodb://127.0.0.1/FileServer';
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(dbUrl)
 .then(function(client){
   let db = client.db('ReactApp')

   // let change_streams = db.collection('messages').watch()
   //    change_streams.on('change', function(change){
   //      console.log(JSON.stringify(change));
   //    });
  });

module.exports = function(router, passport){

	router.get('/', mainCheck, function(req, res){
		res.render('index.ejs');
	});

	router.get('/room2', roomService, function(req, res){
		res.render('room2', { user: req.user });
	});

	router.get('/room', roomService, function(req, res){
		mongo.MongoClient.connect(dbUrl, function(error, db) {
			Message.find({}, function(err, messages){
				res.render('room', { user: req.user, messages: messages});
			})

		});
	});

	function mainCheck(req, res, next){
    if(req.isAuthenticated()){
      res.redirect('/auth/main');
    }else{
      return next();
    }
  }
	function roomService(req, res, next){
    if(req.isAuthenticated()){
			return next();
    }else{
			res.redirect('/auth/signup');
    }
  }
};
