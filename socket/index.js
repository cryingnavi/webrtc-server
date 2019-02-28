const uuidv4 = require('uuid/v4');
var WebSocketServer = require('websocket').server;
var RoomMgr = require("../chat/RoomMgr")
var UserMgr = require("../chat/UserMgr")

var ws = null;

module.exports = {
  createSocket: function (server) {
    // create the server
    ws = new WebSocketServer({
      httpServer: server
    });

    ws.on('request', function(request) {
      var conn = request.accept(null, request.origin);

      var uuid = uuidv4();
      conn.uuid = uuid;
      UserMgr.createUser(uuid, conn)

      conn.on('message', function(message) {
        var data = JSON.parse(message.utf8Data);
        if (data.header.command === "ready") {
          var room = RoomMgr.getRoom(data.body.roomId);
          if (!room) {
            room = RoomMgr.createRoom(data.body.roomId);
            room.addUser(UserMgr.getUser(data.header.userId));
          } else {
            room.addUser(UserMgr.getUser(data.header.userId));
          }

          console.log(room.users.length);
        }
      });

      conn.on('close', function(connection) {

      });

      con.sendUTF(JSON.stringify({
        header: {
          command: 'connect'
        },
        body: {
          token: uuid
        }
      }));
    });
  }
};
