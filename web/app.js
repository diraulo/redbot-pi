var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var routes = require('./routes/index');
var commands = require('./routes/commands');

var app = express();

serverStatus = {
  hasArduino: false,
  hasCamera: false,
  currentAI: 'none',
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/command', commands);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// var port = normalizePort(process.env.PORT || '3000');
app.set('port', 4000);

//
// module.exports = app;
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Start server
http.listen(3000, function () {
  console.log('BoeBot-pi server listening on %d', 3000);
});

io.on('connection', function(socket) {
  console.log('A user is connected');
  socket.emit('robot status', { data: 'server connected' });

  socket.on('robot command', function(data) {
    processRobotCommand (data.data);
  });

  socket.on('robot update', function(data) {
    var updatedData = data.data;
    updateRobotStatus(updatedData);
  });
});

// Interprets and acts on a given command (expects strings split by "-")
function processRobotCommand (command) {
  var parsedCommand = command.split("-");
  console.log('----- Command: -----');
  console.log(parsedCommand);

  if (serverStatus.hasArduino) {
    // commands to johnny five
    // A bit convoluted here: commands are split between '-', with an arbitrary order for each section
    if (parsedCommand[0] == 'manual') {
      if (parsedCommand[1] == 'throttle') {
        if (parsedCommand.length < 4) {
          parsedCommand[3] = stringValues['throttleTime'];
        }
        if (parsedCommand[2] in stringValues) {
          accelChange(stringValues[parsedCommand[2]], parsedCommand[3]);
        }
        else {
          accelChange(parseInt(parsedCommand[2]), parsedCommand[3]);
        }
      }
      else if (parsedCommand[1] == 'turn') {
        if (parsedCommand[2] in stringValues) {
          steerChange(stringValues[parsedCommand[2]]);
        }
        else {
          steerChange(parseInt(parsedCommand[2]));
        }
      }
    }
    // AI commands - to be forwarded to opencv
    else if (parsedCommand[0] == 'face') {
      console.log('facing');
      if (parsedCommand[1] == 'begin') {
        serverStatus.currentAI = 'face';
      }
      else {
        serverStatus.currentAI = 'none';
      }
    }
    else if (parsedCommand[0] == 'red') {
      if (parsedCommand[1] == 'begin') {
        serverStatus.currentAI = 'red';
      }
      else {
        serverStatus.currentAI = 'none';
      }
    }
    else {    // parsedCommand[0] = 'stop'
      steerChange(stringValues['neutral']);
      accelChange(stringValues['stop']);
    }
  }
}

// Broadcasts an update to the robot status
function updateRobotStatus (updatedData) {
  updatedData['Time'] = new Date();
  updatedData['Arduino Attached'] = serverStatus.hasArduino;

  socket.broadcast.emit('robot status', { 'data': updatedData });
}

var five = require("johnny-five")
  , board, servo;

var arduinoServos = {};
var throttleTimeout;
var leftServo = {
  pin: 11,
  type: "continuous",   // Default: "standard". Use "continuous" for continuous rotation servos
};
var rightServo = {
  pin: 12,
  type: "continuous",   // Default: "standard". Use "continuous" for continuous rotation servos
};
