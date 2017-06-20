var User = require('../models/user');
var mongo = require('mongodb');
//var dbUrl = 'mongodb://localhost/ReactApp';
var dbUrl = 'mongodb://oceesay:oman531999@ds117919.mlab.com:17919/oc_node_db';
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var fs = require('fs');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var request = require('superagent');
var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

module.exports = function(router, passport){

  //localhost:8080/auth/



	router.get('/main', isLoggedInIndex, function(req, res){

		res.render('main', { user: req.user });

	});



  router.get('/login', function(req, res){

    res.render('login.ejs', { message: req.flash('loginMessage') });

  });



  router.post('/login', passport.authenticate('local-login', {

    successRedirect: '/auth/profile',

    failureRedirect: 'login',

    failureFlash: true

  }));



	router.get('/signup', function(req, res){

		res.render('signup.ejs', { message: req.flash('signupMessage') });

	});





	router.post('/signup', passport.authenticate('local-signup', {

		successRedirect: '/',

		failureRedirect: '/auth/signup',

		failureFlash: true

	}));



  router.get('/profile', isLoggedIn, function(req, res){

		/*request
      .get('http://localhost:8080/auth/profile')
      .set('Accept', 'application/json')
      .end(function(err, response){
        var results = response.body.results;
				console.log("RESULTS: "+results);
      });
			console.log("TEST");*/
			res.render('profile.ejs', { user: req.user});

  });

	router.post('/goodbye', function(req, res){

		console.log(req.user._id);

		mongo.connect(dbUrl, function(err, db) {
			assert.equal(null, err);
			db.collection("users").deleteOne({_id: req.user._id});
			res.redirect('/');
		});

  });

	router.post('/upload', upload.single('file'), function(req, res){

		var file = '/' + req.file.filename;
		fs.readFile( req.file.path, function (err, data) {
			var s3bucket = new AWS.S3({params: {Bucket: 'omar.karina'}});
			var paramsS3 = {
					Key: req.file.originalname,
					Body: data,
					ContentType: req.file.mimetype
			};
			s3bucket.upload(paramsS3, function (err, data) {
					if (err) {
							console.log('ERROR MSG: ', err);
					} else {
							console.log('Successfully uploaded data');
							res.redirect('/auth/profile');
							// fs.unlink("./xml/"+POrder.toString()+'.xml', (err) => {
							// 	if (err) {
							// 			console.log("failed to delete local file:"+err);
							// 	} else {
							// 			console.log('successfully deleted local image');
							// 	}
							// });
					}
			});
		 });


	});



	/*router.get('/:username/:password', function(req, res){

		var newUser = new User();

		newUser.local.username = req.params.username;

		newUser.local.password = req.params.password;

		console.log(newUser.local.username + " " + newUser.local.password);

		newUser.save(function(err){

			if(err)

				throw err;

		});

		res.send("Success!");

	})*/



	router.get('/logout', function(req, res){

		req.logout();

		res.redirect('/');

	})



  function isLoggedIn(req, res, next){

    if(req.isAuthenticated()){

      return next();

    }else{

      res.redirect('/auth/login');

    }

  }



  function isLoggedInIndex(req, res, next){

    if(req.isAuthenticated()){

      return next();

    }else{

      res.redirect('/auth/login');

    }

  }



};
