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
			mongo.MongoClient.connect(dbUrl, function(error, db) {
				var bucket = new mongo.GridFSBucket(db);
				var downloadStream = bucket.openDownloadStreamByName(req.user._id);
				bucket.find({filename: req.user._id}).toArray((err, files) => {

					if(files.length === 0 || !files){
						console.log("NO FILES FOUND");
					}else{
						console.log(files);
					}

				});
				res.render('profile.ejs', { user: req.user});
				var gotData = false;
				// downloadStream.on('data', function(data) {
				// 	assert.ok(!gotData);
				// 	gotData = true;
				// 	res.render('profile.ejs', { user: req.user, files: data});
				// });
				//
				// downloadStream.on('end', function() {
				// 	assert.ok(gotData);
				// });

			});
  });

	router.post('/goodbye', function(req, res){

		mongo.connect(dbUrl, function(err, db) {
			assert.equal(null, err);
			db.collection("users").deleteOne({_id: req.user._id});
			res.redirect('/');
		});

  });

	router.post('/upload', upload.single('file'), function(req, res){

		var file = '/' + req.file.filename;
		console.log("req.file: \n", req.file);
		fs.readFile( req.file.path, function (err, data) {
			fs.writeFile(file, data, function (err) {
			 if( err ){
						console.error( err );
						response = {
								 message: 'Sorry, file couldn\'t be uploaded.',
								 filename: req.file.originalname
						};
			 }else{
						 response = {
								 message: 'File uploaded successfully',
								 filename: req.file.originalname
						};
				}
				mongo.MongoClient.connect(dbUrl, function(error, db) {
				  assert.ifError(error);

				  var bucket = new mongo.GridFSBucket(db);
					fs.createReadStream("./uploads/"+req.file.filename).
				    pipe(bucket.openUploadStream(req.user._id)).
				    on('error', function(error) {
				      assert.ifError(error);
				    }).
				    on('finish', function() {
				      console.log('done!');
							var downloadStream = bucket.openDownloadStreamByName(req.user._id);

					    var gotData = false;
					    downloadStream.on('data', function(data) {
					      assert.ok(!gotData);
					      gotData = true;
								console.log(data.toString('utf8'));
					    });

					    downloadStream.on('end', function() {
					      assert.ok(gotData);
					    });

							res.redirect('/auth/profile');
							fs.unlinkSync("./uploads/"+req.file.filename);
				    });
				});
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
