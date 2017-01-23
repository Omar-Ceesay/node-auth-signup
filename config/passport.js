
var LocalStrategy = require('passport-local').Strategy;



var User = require('../app/models/user');





module.exports = function(passport){

  passport.serializeUser(function(user, done){

    done(null, user.id);

  })



  passport.deserializeUser(function(id, done){

    User.findById(id, function(err, user){

      done(err, user);

    });

  });



  passport.use('local-signup', new LocalStrategy({

    usernameField: 'username',

    passwordField: 'password',

    passReqToCallback: true

  },

  function(req, username, password, done){

    var mail = req.body.email;

    process.nextTick(function(){

      User.findOne({'local.username': username}, function(err, user){

        if(err){

          return done(err);

        }else if(user){

          return done(null, false, req.flash('signupMessage', 'That username is already taken.'));

        }else{

          var newUser = new User();

          newUser.local.username = username;

          newUser.local.password = password;

          newUser.local.email = req.body.email;

          newUser.local.name = req.body.name;



          newUser.save(function(err){

            if(err){

              throw err;

            }else{

              return done(null, newUser);

            }

          })

        }

      })

    });

  }

  ))



  passport.use('local-login', new LocalStrategy({

    usernameField: 'username',

    passwordField: 'password',

    passReqToCallback: true

  },

  function(req, username, password, done){

      process.nextTick(function(){

        User.findOne({ 'local.username': username }, function(err, user){

          if(err){

            return done(err);

          }else if(!user){

            return done(null, false, req.flash('loginMessage', 'No user found'));

          }else if (user.local.password != password) {

            return done(null, false, req.flash('loginMessage', 'Incorrect password'));

          }else{

            return done(null, user);

          }

        })

      })

  }

))

}
