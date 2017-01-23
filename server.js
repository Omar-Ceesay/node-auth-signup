var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 8080;
var dbUrl = 'mongodb://oceesay:oman531999@ds117919.mlab.com:17919/oc_node_db';
//var client = require('twilio')('AC9c5006526a870fb2023c8247cdf5081d', 'b188e46e390578f26e9ba7efb30ad38a');

var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');
var flash = require('connect-flash');
var MongoStore = require('connect-mongo')(session);
var io = require('socket.io')(http);

mongoose.connect(dbUrl, function(err, response){
  if(err){
    console.log('failed to connect to ' + dbUrl);
  }
  else{
    console.log('Connected to ' + dbUrl);
  }
});
require('./config/passport')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({secret: 'anystringoftext',
				 saveUninitialized: true,
				 resave: true,
         store: new MongoStore({ mongooseConnection: mongoose.connection})}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var room1 = io.of('/room');
room1.on('connection', function(socket){
  console.log('someone connected');
  socket.on('chat message', function(msg){
    room1.emit('chat message', msg);
  });
  room1.on('connection', function(socket){
  socket.broadcast.emit('User has connected');
  });
  room1.on('disconnect', function(socket){
  socket.broadcast.emit('User has disconnected');
  });
});

var room2 = io.of('/room2')
room2.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
    socket.broadcast.emit('User has disconnected');
  });
  socket.on('chat message', function(msg){
    room2.emit('chat message', msg);
  });
  socket.on('connection', function(socket){
    room2.broadcast.emit('User has connected');
  });
});


app.set('view engine', 'ejs');

/*app.get('/chat', function(req, res){
  client.sendMessage({
    to: '+16517560283',
    from: '+16122609628',
    body: "Hey what's up"
  },function(err, data){
    if(!err){
      console.log(err);
      console.log(responseData.from);
      console.log(responseData.body);
    }
  })
})  */

//auth route
var auth = express.Router();
require('./app/routes/auth.js')(auth, passport);
app.use('/auth', auth);


require('./app/routes.js')(app, passport);

http.listen(port);
console.log('Server running on port: ' + port);
