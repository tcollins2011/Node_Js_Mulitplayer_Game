const express = require("express");
const app = express();
const serv = require("http").Server(app);
const mongoose = require("mongoose");
const db = require("./models");
require("./entity");

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/My_Game", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/client/index.html");
});
app.use(express.static(__dirname + "/client"));
// app.use("/client", express.static(__dirname + "/client"));

serv.listen(process.env.PORT || 2000);

SOCKET_LIST = {};

var DEBUG = true;

var isValidPassword = function (data, cb) {
  db.Account.find(
    { username: data.username, password: data.password },
    function (err, res) {
      if (res.length > 0) {
        cb(true);
      } else {
        cb(false);
      }
    }
  );
};
var isUserNameTaken = function (data, cb) {
  db.Account.find({ username: data.username }, function (err, res) {
    if (res.length > 0) {
      cb(true);
    } else {
      cb(false);
    }
  });
};
var addUser = function (data, cb) {
  db.Account.create(
    { username: data.username, password: data.password },
    function (err, res) {
      cb();
    }
  );
};
var io = require("socket.io")(serv, {});
io.sockets.on("connection", function (socket) {
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;
  socket.on("signIn", function (data) {
    isValidPassword(data, function (res) {
      if (res) {
        socket.emit("signInResponse", { success: true });
        Player.onConnect(socket, data.username);
      } else {
        socket.emit("signInResponse", { success: false });
      }
    });
  });
  socket.on("signUp", function (data) {
    isUserNameTaken(data, function (res) {
      if (res) {
        socket.emit("signUpResponse", { success: false });
      } else {
        addUser(data, function () {
          socket.emit("signUpResponse", { success: true });
        });
      }
    });
  });
  socket.on("disconnect", function () {
    delete SOCKET_LIST[socket.id];
    Player.onDisconnect(socket);
  });

  socket.on("evalServer", function (data) {
    if (!DEBUG) {
      return;
    }
    var res = eval(data);
    socket.emit("evalAnswer", res);
  });
});

setInterval(function () {
  var packs = Entity.getFrameUpdateData();
  for (var i in SOCKET_LIST) {
    var socket = SOCKET_LIST[i];
    socket.emit("init", packs.initPack);
    socket.emit("update", packs.updatePack);
    socket.emit("remove", packs.removePack);
  }
}, 40);
