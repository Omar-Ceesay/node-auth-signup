var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 8080;
var dbUrl = process.env.dbUrl || 'mongodb://localhost/ReactApp';
var Message = require('./app/models/message');

var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');
var flash = require('connect-flash');
var MongoStore = require('connect-mongo')(session);
var io = require('socket.io')(http);
var methodOverride = require("method-override");
var MongoWatch = require('mongo-watch');

var watcher = new MongoWatch({parser: 'pretty'});

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
app.use(methodOverride("_method"));
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

var room2 = io.of('/room2');
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

//auth route
var auth = express.Router();
require('./app/routes/auth.js')(auth, passport);
app.use('/auth', auth);

//api route
var api = express.Router();
require('./app/routes/api.js')(api, passport);
app.use('/api', api);

app.post('/room/message/:username', function(req, res){
  var socket = io.of('/room');
  var newMessage = new Message();
  newMessage.body = req.body.body;
  newMessage.uploadDate = Date.now();
  newMessage.user = req.params.username;

  newMessage.save(function(err){
    if(err){
      throw err;
    }else{
      socket.emit('chat message', {body: req.body.body, user: req.params.username});
      res.redirect('/room');
    }
  })
});


require('./app/routes.js')(app, passport);

http.listen(port, "0.0.0.0");
console.log('Server running on port: ' + port);
