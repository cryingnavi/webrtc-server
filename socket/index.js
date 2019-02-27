var WebSocketServer = require('websocket').server;
var RoomMgr = require("../chat/RoomMgr")
var User = require("../chat/user")

var ws = null;

module.exports = {
  createSocket: function (server) {
    // create the server
    ws = new WebSocketServer({
      httpServer: server
    });

    ws.on('request', function(request) {
      var conn = request.accept(null, request.origin);

      conn.on('message', function(message) {
        var data = JSON.stringify(message.utf8Data);
        if (data.header.command === "connect") {
          if (RoomMgr.getRoom(data.body.roomId)) {
            var room = RoomMgr.createRoom(data.body.roomId);
            room.addUser(new User(data.header.userId, conn));
          }
        }
      });

      conn.on('close', function(connection) {

      });
    });
  }
};
