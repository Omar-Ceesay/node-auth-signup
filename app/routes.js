var User = require('./models/user');
module.exports = function(app, passport){

	app.get('/', mainCheck, function(req, res){
		res.render('index.ejs');
	});

	app.get('/room2', function(req, res){
		res.render('room2', { user: req.user });
	});

	app.get('/room', function(req, res){
		res.render('room', { user: req.user });
	});

	function mainCheck(req, res, next){
    if(req.isAuthenticated()){
      res.redirect('/auth/main');
    }else{
      return next();
    }
  }
};
