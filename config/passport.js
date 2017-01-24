
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

      /* User.findOne({ fieldname: "fieldvalue" })  THIS MATCHS THE FIELD usernameUpper TO THE VALUE PASSED IN THE username INPUT ON SIGNUP.ejs */
      User.findOne({'usernameUpper'/* Name on the signup form */: username.toUpperCase()}, function(err, user){
        if(err){
          console.log(username);

          return done(err);

        }else if(user){

          return done(null, false, req.flash('signupMessage', 'That username is already taken.'));

        }else{

          var newUser = new User();
          newUser.username = username;

          newUser.usernameUpper = username.toUpperCase();

          newUser.password = password;

          newUser.email = req.body.email;

          newUser.name = req.body.name;



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

    usernameField: 'usernameUpper',

    passwordField: 'password',

    passReqToCallback: true

  },

  function(req, username, password, done){

      process.nextTick(function(){
        username = username.toUpperCase();

        User.findOne({ 'usernameUpper': username }, function(err, user){

          if(err){

            return done(err);

          }else if(!user){

            return done(null, false, req.flash('loginMessage', 'No user found'));

          }else if (user.password != password) {

            return done(null, false, req.flash('loginMessage', 'Incorrect password'));

          }else{

            return done(null, user);

          }

        })

      })

  }

))

}
