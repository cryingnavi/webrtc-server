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
      UserMgr.createUser(uuid, conn);

      conn.on('message', function(message) {

        console.log(message.utf8Data);

        var data = JSON.parse(message.utf8Data);
        var room = RoomMgr.getRoom(data.body.roomId);
        if (data.header.command === "call") {
          if (!room) {
            room = RoomMgr.createRoom(data.body.roomId);
            room.addOfferUser(UserMgr.getUser(data.header.token));
          } else {
            room.addAnswerUser(UserMgr.getUser(data.header.token));

            var offer = room.getOfferUser();
            offer.send({
              header: {
                command: 'on_call'
              },
              body: {
                answer: room.getAnswerUser().getToken()
              }
            });
          }
        } else if (data.header.command === "offer_sdp") {
          var answer = room.getAnswerUser();
          answer.send({
            header: {
              command: 'on_offer_sdp'
            },
            body: {
              sdp: data.body.sdp
            }
          });
        } else if (data.header.command === "answer_sdp") {
          var offer = room.getOfferUser();
          offer.send({
            header: {
              command: 'on_answer_sdp'
            },
            body: {
              sdp: data.body.sdp
            }
          });
        } else if (data.header.command === "offer_candidate") {
          var answer = room.getAnswerUser();
          answer.send({
            header: {
              command: 'on_offer_candidate'
            },
            body: {
              sdp: data.body.sdp
            }
          });
        } else if (data.header.command === "answer_candidate") {
          var offer = room.getOfferUser();
          offer.send({
            header: {
              command: 'on_answer_candidate'
            },
            body: {
              sdp: data.body.sdp
            }
          });
        }
      });

      conn.on('close', function(connection) {

      });

      conn.sendUTF(JSON.stringify({
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
