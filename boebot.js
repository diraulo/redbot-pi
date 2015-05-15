var five = require("johnny-five");
var keypress = require("keypress");

keypress(process.stdin);

var leftServo = {
  pin: 11,
  type: "continuous",   // Default: "standard". Use "continuous" for continuous rotation servos
};
var rightServo = {
  pin: 12,
  type: "continuous",   // Default: "standard". Use "continuous" for continuous rotation servos
};

var board = new five.Board();

board.on("ready", function() {

  console.log("Use directional keys to control the robot");
  arduinoServos = {
    leftServo: new five.Servo(leftServo),
    rightServo: new five.Servo(rightServo)
  };

  leftServo = arduinoServos.leftServo;
  rightServo = arduinoServos.rightServo;

  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.setRawMode(true);

  process.stdin.on("keypress", function(ch, key) {

    if (!key) {
      return;
    }

    if (key.name === "q") {
      console.log("Quitting");
      process.exit();
    } else if (key.name === "up") {
      console.log("Forward...");
      leftServo.cw();
      rightServo.ccw();
    } else if (key.name === "down") {
      console.log("Reverse...");
      leftServo.ccw();
      rightServo.cw();
    } else if (key.name === "left") {
      console.log("Turning Left...");
      leftServo.cw();
      rightServo.cw();
    } else if (key.name === "right") {
      console.log("Turning Right...");
      leftServo.ccw();
      rightServo.ccw();
    } else if (key.name === "space") {
      console.log("Stopping");
      leftServo.stop();
      rightServo.stop();
    }
  });
});
