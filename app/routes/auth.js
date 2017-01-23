var User = require('../models/user');

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

    res.render('profile.ejs', { user: req.user })

  });



	router.get('/upload', function(req, res){

		var file = new File();

		file.local.filename = req.params.filename;

		file.save(function(err){

			if(err){

				throw err;

			}

		});

		console.log(file.local.filename);

		res.send("File Sent");

	});



	router.post('/upload', function(req, res){

		var file = new File();

		file.local.filename = req.params.filename;

		file.save(function(err){

			if(err){

				throw err;

			}

		});

		console.log(file.local.filename);

		res.send("File Sent");

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
