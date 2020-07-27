// Constants
const TILE_SIZE = 32;
const WIDTH = 800;
const HEIGHT = 800;
// sign
var socket = io();
var signDiv = document.getElementById("signDiv");
var signDivUsername = document.getElementById("signDiv-username");
var signDivPassword = document.getElementById("signDiv-password");
var signDivSignUp = document.getElementById("signDiv-signUp");
var signDivSignIn = document.getElementById("signDiv-signIn");

signDivSignIn.onclick = function () {
  socket.emit("signIn", {
    username: signDivUsername.value,
    password: signDivPassword.value,
  });
};

socket.on("signInResponse", function (data) {
  if (data.success) {
    signDiv.style.display = "none";
    gameDiv.style.display = "inline-block";
  } else {
    alert("sign in unsuccessful.");
  }
});

signDivSignUp.onclick = function () {
  socket.emit("signUp", {
    username: signDivUsername.value,
    password: signDivPassword.value,
  });
};

socket.on("signUpResponse", function (data) {
  if (data.success) {
    alert("sign up successful.");
  } else {
    alert("sign up unsuccessful.");
  }
});
// chat
var chatText = document.getElementById("chat-text");
var chatInput = document.getElementById("chat-input");
var chatForm = document.getElementById("chat-form");

socket.on("addToChat", function (data) {
  chatText.innerHTML += "<div>" + data + "</div>";
});
socket.on("evalAnswer", function (data) {
  console.log(data);
});

chatForm.onsubmit = function (e) {
  e.preventDefault();
  if (chatInput.value[0] === "/")
    socket.emit("evalServer", chatInput.value.slice(1));
  if (chatInput.value[0] === "@") {
    socket.emit("sendPmToServer", {
      username: chatInput.value.slice(1, chatInput.value.indexOf(":")),
      message: chatInput.value.slice(chatInput.value.indexOf(":") + 1),
    });
  } else {
    socket.emit("sendMsgToServer", chatInput.value);
  }
  chatInput.value = "";
};
// Ui

var changeMap = function () {
  socket.emit("changeMap");
};
// game
var Img = {};
Img.player = new Image();
Img.player.src = "../img/player_sprite.png";
Img.bullet = new Image();
Img.bullet.src = "../img/bullet.png";
Img.map = {};
Img.map["field"] = new Image();
Img.map["field"].src = "../img/map.png";
Img.map["forest"] = new Image();
Img.map["forest"].src = "../img/TileMap1.png";
console.log(Img);

var ctx = document.getElementById("ctx").getContext("2d");
var ctxUi = document.getElementById("ctx-ui").getContext("2d");
ctxUi.font = "30px Arial";

var Player = function (initPack) {
  var self = {};
  self.id = initPack.id;
  self.x = initPack.x;
  self.y = initPack.y;
  self.hp = initPack.hp;
  self.hpMax = initPack.hpMax;
  self.score = initPack.score;
  self.map = initPack.map;
  self.draw = function () {
    if (Player.list[selfId].map !== self.map) {
      return;
    }
    var x = self.x - Player.list[selfId].x + WIDTH / 2;
    var y = self.y - Player.list[selfId].y + HEIGHT / 2;
    var hpWidth = (30 * self.hp) / self.hpMax;
    ctx.fillStyle = "red";
    ctx.fillRect(self.x - hpWidth / 2, self.y - 25, hpWidth, 4);

    var width = Img.player.width / 2;
    var height = Img.player.height / 2;
    // console.log(width, height, x, y);
    // 27.5 38.5
    ctx.drawImage(Img.player, self.x - 13.75, self.y - 19.25, 32, 32);
  };
  Player.list[self.id] = self;
  return self;
};
Player.list = {};

var Bullet = function (initPack) {
  var self = {};
  self.id = initPack.id;
  self.x = initPack.x;
  self.y = initPack.y;
  self.map = initPack.map;
  self.draw = function () {
    if (Player.list[selfId].map !== self.map) {
      return;
    }
    var width = Img.bullet.width / 4;
    var height = Img.bullet.height / 4;
    var x = self.x - Player.list[selfId].x + WIDTH / 2;
    var y = self.y - Player.list[selfId].y + HEIGHT / 2;
    ctx.drawImage(
      Img.bullet,
      0,
      0,
      Img.bullet.width,
      Img.bullet.height,
      self.x - 6,
      self.y - 10,
      width,
      height
    );
  };
  Bullet.list[self.id] = self;
  return self;
};
Bullet.list = {};
var selfId = null;
// init
socket.on("init", function (data) {
  if (data.selfId) {
    selfId = data.selfId;
  }
  for (var i = 0; i < data.player.length; i++) {
    new Player(data.player[i]);
  }
  for (var i = 0; i < data.bullet.length; i++) {
    new Bullet(data.bullet[i]);
  }
});
// update
socket.on("update", function (data) {
  for (var i = 0; i < data.player.length; i++) {
    var pack = data.player[i];
    var p = Player.list[pack.id];
    if (p) {
      if (pack.x !== undefined) {
        p.x = pack.x;
      }
      if (pack.y !== undefined) {
        p.y = pack.y;
      }
      if (pack.hp !== undefined) {
        p.hp = pack.hp;
      }
      if (pack.score !== undefined) {
        p.score = pack.score;
      }
      if (pack.map !== undefined) {
        p.map = pack.map;
      }
    }
  }
  for (var i = 0; i < data.bullet.length; i++) {
    var pack = data.bullet[i];
    var b = Bullet.list[data.bullet[i].id];
    if (b) {
      if (pack.x !== undefined) {
        b.x = pack.x;
      }
      if (pack.y !== undefined) {
        b.y = pack.y;
      }
    }
  }
});
// remove
socket.on("remove", function (data) {
  for (var i = 0; i < data.player.length; i++) {
    delete Player.list[data.player[i]];
  }
  for (var i = 0; i < data.bullet.length; i++) {
    delete Bullet.list[data.bullet[i]];
  }
});

setInterval(function () {
  if (!selfId) {
    return;
  }
  ctx.clearRect(0, 0, 800, 800);
  drawMap();
  drawScore();
  for (var i in Player.list) {
    Player.list[i].draw();
  }
  for (var i in Bullet.list) {
    Bullet.list[i].draw();
  }
}, 40);

var drawMap = function () {
  var player = Player.list[selfId];
  var x = 0;
  var y = 0;
  ctx.drawImage(Img.map[player.map], x, y);
};

var drawScore = function () {
  if (lastScore === Player.list[selfId].score) {
    return;
  }
  lastScore = Player.list[selfId].score;
  ctxUi.clearRect(0, 0, 500, 500);
  ctxUi.fillStyle = "white";
  ctxUi.fillText(Player.list[selfId].score, 0, 30);
};
var lastScore = null;
document.onkeydown = function (event) {
  if (event.keyCode === 68) {
    socket.emit("keyPress", { inputId: "right", state: true });
  } else if (event.keyCode === 83) {
    socket.emit("keyPress", { inputId: "up", state: true });
  } else if (event.keyCode === 65) {
    socket.emit("keyPress", { inputId: "left", state: true });
  } else if (event.keyCode === 87) {
    socket.emit("keyPress", { inputId: "down", state: true });
  }
};

document.onkeyup = function (event) {
  if (event.keyCode === 68) {
    socket.emit("keyPress", { inputId: "right", state: false });
  } else if (event.keyCode === 83) {
    socket.emit("keyPress", { inputId: "up", state: false });
  } else if (event.keyCode === 65) {
    socket.emit("keyPress", { inputId: "left", state: false });
  } else if (event.keyCode === 87) {
    socket.emit("keyPress", { inputId: "down", state: false });
  }
};

document.onmousedown = function (event) {
  socket.emit("keyPress", { inputId: "attack", state: true });
};
document.onmouseup = function (event) {
  socket.emit("keyPress", { inputId: "attack", state: false });
};
document.onmousemove = function (event) {
  var x = event.clientX;
  var y = event.clientY;
  socket.emit("keyPress", { inputId: "mouseAngle", mouseX: x, mouseY: y });
};
document.oncontextmenu = function (event) {
  event.preventDefault();
};
