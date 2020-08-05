require("./maps.js");
var initPack = { player: [], bullet: [] };
var removePack = { player: [], bullet: [] };
const TILE_SIZE = 32;

Entity = function (param) {
  var self = {
    x: 250,
    y: 250,
    spdX: 0,
    spdY: 0,
    id: "",
    map: "forest",
    grid: newMap,
  };

  if (param) {
    if (param.x) {
      self.x = param.x;
    }
    if (param.y) {
      self.y = param.y;
    }
    if (param.map) {
      self.map = param.map;
    }
    if (param.id) {
      self.id = param.id;
    }
  }
  self.update = function () {
    self.updatePosition();
  };
  self.updatePosition = function () {
    self.x += self.spdX;
    self.y += self.spdY;
  };
  self.getDistance = function (pt) {
    return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
  };
  self.isPositionWall = function (pt) {
    var gridX = Math.floor(pt.x / TILE_SIZE);
    var gridY = Math.floor(pt.y / TILE_SIZE);

    if (gridX < 0 || gridX >= self.grid[0].length) {
      return true;
    }
    if (gridY < 0 || gridY >= self.grid.length) {
      return true;
    }
    return self.grid[gridY][gridX];
  };
  return self;
};
Entity.getFrameUpdateData = function () {
  var pack = {
    initPack: {
      player: initPack.player,
      bullet: initPack.bullet,
    },
    updatePack: {
      player: Player.update(),
      bullet: Bullet.update(),
    },
    removePack: {
      player: removePack.player,
      bullet: removePack.bullet,
    },
  };
  initPack.player = [];
  initPack.bullet = [];
  removePack.player = [];
  removePack.bullet = [];

  return pack;
};
Player = function (param) {
  var self = Entity(param);
  var random = Math.floor(Math.random() * 6);
  self.respawnAreaX = [60, 250, 64, 750, 700, 500];
  self.respawnAreaY = [60, 250, 750, 250, 60, 250];

  self.x = self.respawnAreaX[random];
  self.y = self.respawnAreaY[random];
  self.username = param.username;
  self.pressingRight = false;
  self.pressingLeft = false;
  self.pressingUp = false;
  self.pressingDown = false;
  self.pressingAttack = false;
  self.mouseAngle = 0;
  self.maxSpd = 2;
  self.hp = 2;
  self.hpMax = 2;
  self.score = 0;
  self.ammo = 1;
  self.screenWidth = 0;

  var super_update = self.update;
  self.update = function () {
    self.updateSpd();
    super_update();

    if (self.pressingAttack && self.ammo > 0) {
      self.shootBullet(self.mouseAngle);
      self.ammo -= 1;
    }
  };
  self.shootBullet = function (angle) {
    Bullet({
      parent: self.id,
      angle: angle,
      x: self.x,
      y: self.y,
      map: self.map,
    });
  };
  self.updateSpd = function () {
    var bumperRightPos = { x: self.x + 16, y: self.y };
    var bumperLeftPos = { x: self.x - 16, y: self.y };
    var bumperTopPos = { x: self.x, y: self.y + 16 };
    var bumperBottomPos = { x: self.x, y: self.y - 16 };
    if (self.pressingRight && !self.isPositionWall(bumperRightPos)) {
      self.spdX = self.maxSpd;
    } else if (self.pressingLeft && !self.isPositionWall(bumperLeftPos)) {
      self.spdX = -self.maxSpd;
    } else {
      self.spdX = 0;
    }
    if (self.pressingUp && !self.isPositionWall(bumperTopPos)) {
      self.spdY = self.maxSpd;
    } else if (self.pressingDown && !self.isPositionWall(bumperBottomPos)) {
      self.spdY = -self.maxSpd;
    } else {
      self.spdY = 0;
    }
  };

  self.getInitPack = function () {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      hp: self.hp,
      hpMax: self.hpMax,
      score: self.score,
      map: self.map,
    };
  };
  self.getUpdatePack = function () {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      hp: self.hp,
      score: self.score,
      map: self.map,
    };
  };
  Player.list[self.id] = self;
  initPack.player.push(self.getInitPack());
  return self;
};
Player.list = {};
Player.onConnect = function (socket, username) {
  var map = "forest";
  var player = Player({ id: socket.id, map: map, username: username });
  socket.on("keyPress", function (data) {
    if (data.inputId === "left") {
      player.pressingLeft = data.state;
    } else if (data.inputId === "right") {
      player.pressingRight = data.state;
    } else if (data.inputId === "up") {
      player.pressingUp = data.state;
    } else if (data.inputId === "down") {
      player.pressingDown = data.state;
    } else if (data.inputId === "attack") {
      if (data.screenWidth) {
        player.screenWidth = data.screenWidth;
      }
      player.pressingAttack = data.state;
    } else if (data.inputId === "mouseAngle") {
      var x = data.mouseX - (player.x + player.screenWidth);
      var y = data.mouseY - player.y;
      var angle = (Math.atan2(y, x) / Math.PI) * 180;
      player.mouseAngle = angle;
    }
  });

  // socket.on("changeMap", function (data) {
  //   if (player.map === "field") {
  //     player.map = "forest";
  //   } else {
  //     player.map = "field";
  //   }
  // });
  socket.emit("init", {
    selfId: socket.id,
    player: Player.getAllInitPack(),
    bullet: Bullet.getAllInitPack(),
  });
  socket.on("sendMsgToServer", function (data) {
    for (var i in SOCKET_LIST) {
      SOCKET_LIST[i].emit("addToChat", player.username + ": " + data);
    }
  });
  socket.on("sendPmToServer", function (data) {
    var recipientSocket = null;
    for (var i in Player.list) {
      if (Player.list[i].username === data.username) {
        recipientSocket = SOCKET_LIST[i];
      }
    }
    if (recipientSocket === null) {
      socket.emit(
        "addToChat",
        "The player " + data.username + " is not online"
      );
    } else {
      recipientSocket.emit(
        "addToChat",
        "From " + player.username + ":" + data.message
      );
      socket.emit("addToChat", "To " + data.username + ":" + data.message);
    }
  });
};
Player.getAllInitPack = function () {
  var players = [];
  for (var i in Player.list) {
    players.push(Player.list[i].getInitPack());
  }
  return players;
};
Player.onDisconnect = function (socket) {
  delete Player.list[socket.id];
  removePack.player.push(socket.id);
};

Player.update = function () {
  var pack = [];
  for (var i in Player.list) {
    var player = Player.list[i];
    player.update();
    pack.push(player.getUpdatePack());
  }
  return pack;
};

Bullet = function (param) {
  var self = Entity(param);
  self.id = Math.random();
  self.angle = param.angle;
  self.spdX = Math.cos((param.angle / 180) * Math.PI) * 12;
  self.spdY = Math.sin((param.angle / 180) * Math.PI) * 12;
  self.parent = param.parent;
  self.bounce = 0;
  self.timer = 0;
  self.toRemove = false;
  var super_update = self.update;
  self.update = function () {
    if (self.bounce > 5) {
      self.toRemove = true;
      if (Player.list[self.parent]) {
        Player.list[self.parent].ammo = 1;
      }
    }

    self.timer++;
    if (self.timer >= 200) {
      self.toRemove = true;
      Player.list[self.parent].ammo = 1;
    }

    super_update();

    var bumperRightPos = { x: self.x + 8, y: self.y };
    var bumperLeftPos = { x: self.x - 8, y: self.y };
    var bumperTopPos = { x: self.x, y: self.y + 8 };
    var bumperBottomPos = { x: self.x, y: self.y - 8 };
    if (self.isPositionWall(bumperRightPos)) {
      self.spdX = -self.spdX;
      self.bounce += 1;
    } else if (self.isPositionWall(bumperLeftPos)) {
      self.spdX = -self.spdX;
      self.bounce += 1;
    } else {
      self.spdX = self.spdX;
    }
    if (self.isPositionWall(bumperTopPos)) {
      self.spdY = -self.spdY;
      self.bounce += 1;
    } else if (self.isPositionWall(bumperBottomPos)) {
      self.spdY = -self.spdY;
      self.bounce += 1;
    } else {
      self.spdY = self.spdY;
    }

    for (var i in Player.list) {
      var p = Player.list[i];
      if (
        (self.map = p.map && self.getDistance(p) < 32 && self.parent != p.id)
      ) {
        p.hp -= 1;
        if (p.hp <= 0) {
          var shooter = Player.list[self.parent];
          if (shooter) {
            shooter.score += 1;
          }
          p.hp = p.hpMax;
          random = Math.floor(Math.random() * 6);
          respawnAreaX = [60, 250, 64, 750, 700, 500];
          respawnAreaY = [60, 250, 750, 250, 60, 250];
          p.x = respawnAreaX[random];
          p.y = respawnAreaY[random];
        }
        self.toRemove = true;
        Player.list[self.parent].ammo = 1;
      }
    }
  };
  self.getInitPack = function () {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      map: self.map,
    };
  };
  self.getUpdatePack = function () {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
    };
  };
  Bullet.list[self.id] = self;
  initPack.bullet.push(self.getInitPack());
  return self;
};
Bullet.list = {};
Bullet.getAllInitPack = function () {
  var bullets = [];
  for (var i in Bullet.list) {
    bullets.push(Bullet.list[i].getInitPack());
  }
  return bullets;
};

Bullet.update = function () {
  var pack = [];
  for (var i in Bullet.list) {
    var bullet = Bullet.list[i];
    bullet.update();
    if (bullet.toRemove) {
      delete Bullet.list[i];
      removePack.bullet.push(bullet.id);
    }
    pack.push(bullet.getUpdatePack());
  }
  return pack;
};
