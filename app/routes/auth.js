const User = require('../models/user');
const mongo = require('mongodb');
const dbUrl = process.env.dbUrl || 'mongodb://127.0.0.1/FileServer';
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const fs = require('fs');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const request = require('superagent');
const fileUpload = require('express-fileupload');
var stream = require('stream');

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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

			mongo.MongoClient.connect(dbUrl, function(error, db) {
				var bucket = new mongo.GridFSBucket(db);
				bucket.find({metadata: {
					ownerID: req.user._id.toString()
				}}).toArray((err, files) => {
					if(files.length === 0 || !files){
						console.log("NO FILES FOUND FOR "+req.user._id);
						res.render('profile.ejs', { user: req.user, files: []});
					}else{

						res.render('profile.ejs', { user: req.user, files: files});
					}

				});
				var gotData = false;

			});
  });

	router.post('/file/:name/:id', function(req, res){

			var tempFile = __dirname+"/temp/"+req.params.id;

			mongo.MongoClient.connect(dbUrl, function(error, db) {
				var bucket = new mongo.GridFSBucket(db);
				bucket.find({metadata: {
					ownerID: req.user._id.toString()
				}}).toArray((err, files) => {


					if(err){
						return res.status(400).send(err);
					}else{
						ObjectId = require('mongodb').ObjectID;
						const file_id = ObjectId(req.params.id);
						var downloadStream = bucket.openDownloadStream(file_id);

					    downloadStream.pipe(fs.createWriteStream(tempFile).on('error', function(err){
					    	console.log(err);
					    }).on('finish', function(){
							res.download(tempFile, req.params.name, function(err){
								if(err){
									console.log(err)
								}else{
					    			console.log("Download Complete");
									fs.unlinkSync(tempFile);
								};
							});
					    }));
					}
				});

			});

	});

	router.post('/file/remove/:name/:id', (req, res) => {
		mongo.MongoClient.connect(dbUrl, function(error, db) {
			var bucket = new mongo.GridFSBucket(db);
			ObjectId = require('mongodb').ObjectID;
			const file_id = ObjectId(req.params.id);
			bucket.delete(file_id, (err) => {
				if(err){
					return console.log(err);
				}
				res.redirect('/auth/profile');
			});
		});
	});

	router.post('/goodbye', function(req, res){

		mongo.connect(dbUrl, function(err, db) {
			assert.equal(null, err);
			db.collection("users").deleteOne({_id: req.user._id});
			res.redirect('/');
		});

  	});

	router.post('/upload', function(req, res){
		const files = req.files.file;
		let id = req.user._id;
		id = id.toString();
		
		mongo.MongoClient.connect(dbUrl, function(error, db){

			var bucket = new mongo.GridFSBucket(db);
			if(files.length){
				console.log("multiple files found\n");
				let count = 0;
				var loop = new Promise((resolve, reject) => {
					files.forEach(function(e, i){
						console.log("Fire",i);
						Object.assign(e, {ownerID: id});
						var bufferStream = new stream.PassThrough();
						bufferStream.end(e.data);
						var uploadStream = bucket.openUploadStream(e.name, {
							chunkSizeBytes: null,
							metadata: {ownerID : id},
							contentType: null,
							aliases: null
						});
						
						uploadStream.once('finish', function(){
							console.log("Finished \n\t"+e.name+" ::="+i);
							count++;
							if(count === files.length){
								resolve("Done");
							}
						});
						bufferStream.pipe(uploadStream);
					});
				});
				loop.then(function(value){
					console.log(value);
					res.redirect('/auth/profile');
				})
			}else{
				var bufferStream = new stream.PassThrough();
				bufferStream.end(files.data);
				var uploadStream = bucket.openUploadStream(files.name, {
						chunkSizeBytes: null,
						metadata: {ownerID : id},
						contentType: null,
						aliases: null
					});
				
				uploadStream.once('finish', function(){
					res.redirect('/auth/profile');
				});
				bufferStream.pipe(uploadStream);
			}
		})

	});


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
