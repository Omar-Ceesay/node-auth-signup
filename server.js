var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 8080;
var dbUrl = process.env.dbUrl;
var Message = require('./app/models/message');

var path = require('path');
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
//var MongoWatch = require('mongo-watch');
const busboy = require('connect-busboy');
var findRemoveSync = require('find-remove');
const fs = require('fs');

//var watcher = new MongoWatch({parser: 'pretty'});

mongoose.connect(dbUrl, function(err, response){
  if(err){
    console.log('failed to connect to ' + dbUrl);
  }
  else{
    console.log('Connected to ' + dbUrl);
  }
});
require('./config/passport')(passport);

setInterval(function(){
  console.log("deleteing files in /public/temp");
  findRemoveSync(__dirname + '/public/temp', {files: "*.*"});
}, 360000);

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(busboy({
    highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
}));
app.use(methodOverride("_method"));
app.use(session({secret: 'anystringoftext',
				 saveUninitialized: true,
				 resave: true,
         store: new MongoStore({ mongooseConnection: mongoose.connection})}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

let allClients = [];

io.on('connection', (socket) => {
  allClients.push(socket);
  let userStatusList = fs.readFileSync('./data/onlineUsers.json', 'utf8');

  socket.on('disconnect', (reason) => {
    console.log("\nClient HAS DISCONNECTED\n");
    var i = allClients.indexOf(socket);
    allClients.splice(i, 1);

    let userStatusList = fs.readFileSync('./data/onlineUsers.json', 'utf8');
    userStatusList = JSON.parse(userStatusList);
  });
});

io.use(function(socket, next) {
  let userStatusList = fs.readFileSync('./data/onlineUsers.json', 'utf8');
  userStatusList = JSON.parse(userStatusList);
  var handshakeData = socket.request;
  onlineUser = handshakeData._query['username'];
  userStatusList.unshift(onlineUser);
  console.log(userStatusList);
  next();
});


var room1 = io.of('/room');
room1.on('connection', function(socket){
  console.log('someone connected');
  socket.on('chat message', function(msg){
    room1.emit('chat message', msg);
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
require('./app/routes/auth.js')(auth, passport, io);
app.use('/auth', auth);

//api route
var api = express.Router();
require('./app/routes/api.js')(api, passport);
app.use('/api', api);

app.post('/room/message', function(req, res){
console.log("New Message!\n\t");
  console.log(req.body);
  var socket = io.of('/room');
  var newMessage = new Message();
  newMessage.body = req.body.message;
  newMessage.uploadDate = Date.now();
  newMessage.user = req.body.username;

  newMessage.save(function(err){
    if(err){
      throw err;
    }else{
      socket.emit('chat message', {body: req.body.message, user: req.body.username});
      // res.redirect('/room');
    }
  })
});
var Chart = require('chart.js');
app.post("/temperature", function(req,res){

  let d = new Date();
  fs.readFile('./data/dht11_temp.json', "utf-8", function(err, data){
    data = data.trim();
    var obj = {
      "date": d.toLocaleDateString(),
      "temp": req.body.temp,
      "time": d.toLocaleTimeString(),
      "exact": d.getTime()
    }

    data = JSON.parse(data);
    data.unshift(obj);
    fs.writeFile('./data/dht11_temp.json', JSON.stringify(data), function(err){
    })
  });

  fs.readFile('./data/dht11_hum.json', "utf-8", function(err, data){
    data = data.trim();

    var obj = {
      "date": d.toLocaleDateString(),
      "temp": req.body.humidity,
      "time": d.toLocaleTimeString(),
      "exact": d.getTime()
    }

    data = JSON.parse(data);
    data.unshift(obj);
    fs.writeFile('./data/dht11_hum.json', JSON.stringify(data), function(err){
      res.send("done");
    })
  });
});

app.get('/temperature', function(req,res){

  fs.readFile('./data/dht11_temp.json', 'utf-8', function(err, data){
    data = data.trim();
    data = data.toString();
    res.render('temperature.ejs', {temp_data: data});
  })
})

require('./app/routes.js')(app, passport);

http.listen(port, "localhost");
console.log('Server running on port: ' + port);
