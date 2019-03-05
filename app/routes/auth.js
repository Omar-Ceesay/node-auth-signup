const User = require('../models/user');
const mongo = require('mongodb');
const dbUrl = process.env.dbUrl;
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const fs = require('fs');
var path = require('path');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const request = require('superagent');
const Busboy = require('connect-busboy');
const stream = require('stream');
var piexif = require("piexifjs");
const Youtube = require("../youtube.js");

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = function(router, passport, io){

	var profile = io.of('/auth/profile');
	var connectedUsers = {};
	profile.on('connection', function(socket){
	  connectedUsers[socket.conn.id] = socket;
	});

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

				User.find({}, function(err, userlist){
					if(err) res.send(err);

					var bucket = new mongo.GridFSBucket(db);
					bucket.find({metadata: {
						ownerID: req.user._id.toString()
					}}).toArray((err, files) => {
						if(files.length === 0 || !files){
							console.log("NO FILES FOUND FOR "+req.user._id);
							res.render('profile.ejs', { user: req.user, files: [], userlist: userlist});
						}else{

							res.render('profile.ejs', { user: req.user, files: files, userlist: userlist});
						}

					});
				}).select(["-password", "-usernameUpper", "-_id", "-__v"]);

			});
  });
	router.post('/file/:name/:id', function(req, res){

			var tempFile = "C:\\Users\\OmarC\\Documents\\git\\node-auth-signup\\public\\temp\\"+req.params.id;

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
					    	// res.send(`<video width='auto' height='auto' controls><source src='../../../${req.params.id+req.params.name}' type='video/mp4'>Your browser does not support the video tag.</video>`);

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

	router.post('/picture', (req,res) =>{
		mongo.MongoClient.connect(dbUrl, function(error, db) {
			var bucket = new mongo.GridFSBucket(db);
			bucket.find({metadata: {
				ownerID: req.user._id.toString()
			}}).toArray((err, files) => {


				if(err){
					return res.status(400).send(err);
				}else{
					var tempFile = "C:\\Users\\OmarC\\Documents\\git\\node-auth-signup\\public\\temp\\"+req.body.id;
					ObjectId = require('mongodb').ObjectID;
					const file_id = ObjectId(req.body.id);
					const ext = path.extname(req.body.filename).toLowerCase();
					if(ext === ".jpg" || ext === ".png" || ext === ".gif") {
						var downloadStream = bucket.openDownloadStream(file_id);
					    downloadStream.pipe(fs.createWriteStream(tempFile).on('error', function(err){
					    	console.log(err);
					    }).on('finish', function(){

					    	fs.readFile(tempFile, function(err, data){
					    		var jpeg = data;
					    		data = data.toString('base64');

					    		res.send(`<img src="data:image/jpeg;base64,${data}"></img>`);
								fs.unlinkSync(tempFile);
					    	})


					    }));
					}else{
						res.send("File extension wasn't correct");
					}
				}
			});

		});
	})

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

  	function formatBytes(a,b){if(0==a)return"0 Bytes";var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]}

	router.post('/upload', function(req, res){

		let id = req.user._id;
		id = id.toString();
		

		mongo.MongoClient.connect(dbUrl, function(error, db){

			if(false){
				let count = 0;
				const bucket = new mongo.GridFSBucket(db);
				var loop = new Promise((resolve, reject) => {
					files.forEach(function(e, i){
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
				busboy = new Busboy({ headers: req.headers });
				req.pipe(req.busboy);
				const fileSize = req.headers['content-length'];
				const bucket = new mongo.GridFSBucket(db);

				req.busboy.on('file', (fieldname, file, filename) => {
					var uploadStream = bucket.openUploadStream(filename, {
							chunkSizeBytes: null,
							metadata: {ownerID : id},
							contentType: null,
							aliases: null
						});

					const file_id = uploadStream.id;

					file.pipe(uploadStream);

					let count = 0;
					let prevPercent = 0;

				    file.on('data', function (data) {
				    	count += data.length;
				    	let percent = Number.parseFloat(count / fileSize).toFixed(4);
				    	percent = Number.parseFloat(percent*100).toFixed(2);
				    	
				    	if((percent-prevPercent) > 0.4){

				    		prevPercent = percent;
				    		connectedUsers[req.cookies.io].emit("file-data", percent);
				    	}
				    	// console.log(`${percent}, total: ${formatBytes(count)}`);
				    });

					file.on('end', () => {
			            console.log(`Upload of '${filename}' finished`);
			            const date = new Date();
			            connectedUsers[req.cookies.io].emit("file-finished", {filename: filename, id: file_id, date: date.toString()});
			        });
				});

				req.busboy.on('finish', () => {
			        // do something maybe
				})

				// // var bufferStream = new stream.PassThrough();
				// // console.log(files)
				// // bufferStream.end(files.data);

				// const readable = new Readable();
				// readable._read = () => {}
				// readable.push(files.data);
				// readable.push(null);
				// console.log(req.files.file)
				// uploadStream.once('finish', function(){
				// 	res.redirect('/auth/profile');
				// });
				// readable.pipe(uploadStream);
			}
		})

	});

	router.get('/allusers', function(req, res){
		mongo.MongoClient.connect(dbUrl, function(error, db){
			User.find({}, function(err, users){
				if(err) res.send(err);
				else res.send(users);
			}).select(["-password", "-usernameUpper", "-_id", "-__v"]);
		});
	})

	var google = require('googleapis');
	var googleAuth = require('google-auth-library');

	var SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
	var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
	var TOKEN_PATH = TOKEN_DIR + 'google-apis-nodejs-quickstart.json';

	function getNewToken(oauth2Client, requestData, callback) {
		var readline = require('readline');
		var authUrl = oauth2Client.generateAuthUrl({
		  access_type: 'offline',
		  scope: SCOPES
		});
		var rl = readline.createInterface({
		  input: process.stdin,
		  output: process.stdout
		});
		rl.question('Enter the code from that page here: 4/oQDLyG-9Jhsg8dC92pc0Fs3veDen8xHpwzsRI7wXwGPLknsYJG1ISuh1BjPF1v55hYa4IcpQJQMESdjLVebBLuM', function(code) {
		  rl.close();
		  oauth2Client.getToken("4/oQDLyG-9Jhsg8dC92pc0Fs3veDen8xHpwzsRI7wXwGPLknsYJG1ISuh1BjPF1v55hYa4IcpQJQMESdjLVebBLuM", function(err, token) {
			if (err) {
			  console.log('Error while trying to retrieve access token', err);
			  return;
			}
			oauth2Client.credentials = token;
			storeToken("4/oQBuqqm3dUJ6C0JIrDWEKJIu2BpFbRYExdRkafYur4BDVRJdidD_RxQ3sp3ir3l9wm0Hit2uZ4Bsx-gCwN4rAkk");
			callback(oauth2Client, requestData);
		  });
		});
	  }
		var clientSecret = "IKNkdVYkzditGB1hqykDSRoe";
	function authorize(credentials, requestData, callback) {
		var clientId = "542826481216-onjce9io1t5ostop7a5di0flm5k2blsa.apps.googleusercontent.com";
		var redirectUrl = "https://7438957f.ngrok.io";
		var auth = new googleAuth();
		var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
		
		getNewToken(oauth2Client, requestData, callback);
	}

	router.get('/player', function(req, res){

		authorize(clientSecret, {'params': {'mine': 'true',
                   'maxResults': '25',
                   'part': 'snippet,contentDetails',
                   'onBehalfOfContentOwner': '',
                   'onBehalfOfContentOwnerChannel': 'Channel'}}, playlistsListMine);

		function playlistsListMine(auth, requestData) {
			var service = google.youtube('v3');
			var parameters = removeEmptyParameters(requestData['params']);
			parameters['auth'] = auth;
			service.playlists.list(parameters, function(err, response) {
				if (err) {
					console.log('The API returned an error: ' + err);
					return;
				}else{
					console.log("\n\nresponse\n");
				}
			});
		}
		res.render('player');
	})

	router.post('/:id/addFolder', function(req, res){
		console.log(req.body);

		mongo.MongoClient.connect(dbUrl, function(error, db){

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
