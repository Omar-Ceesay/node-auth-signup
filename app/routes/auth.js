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

	router.post('/goodbye', function(req, res){

		console.log(req.user._id);

		mongo.connect(dbUrl, function(err, db) {
			assert.equal(null, err);
			db.collection("users").deleteOne({_id: req.user._id});
			res.redirect('/');
		});

  });

	router.get('/profile', isLoggedIn, function(req, res){
		var imgData;
		var params = {
		 Bucket: "omar.karina",
		 MaxKeys: 10
		};
		s3.listObjectsV2(params, function(err, data) {
			if (err) console.log(err, err.stack); // an error occurred
			else{
				console.log(data);
				imgData = data;
			}
			/*
			data = {
			 Contents: [
					{
				 ETag: "\"70ee1738b6b21e2c8a43f3a5ab0eee71\"",
				 Key: "happyface.jpg",
				 LastModified: <Date Representation>,
				 Size: 11,
				 StorageClass: "STANDARD"
				},
					{
				 ETag: "\"becf17f89c30367a9a44495d62ed521a-1\"",
				 Key: "test.jpg",
				 LastModified: <Date Representation>,
				 Size: 4192256,
				 StorageClass: "STANDARD"
				}
			 ],
			 IsTruncated: true,
			 KeyCount: 2,
			 MaxKeys: 2,
			 Name: "examplebucket",
			 NextContinuationToken: "1w41l63U0xa8q7smH50vCxyTQqdxo69O3EmK28Bi5PcROI4wI/EyIJg==",
			 Prefix: ""
			}
			*/
		});
			res.render('profile.ejs', { user: req.user, pic: imgData});

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
