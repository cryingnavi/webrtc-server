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
        var data = JSON.parse(message.utf8Data);
        var room = RoomMgr.getRoom(data.body.roomId);
        var offer = null;
        var answer = null;
        if (data.header.command === "call") {
          if (!room) {
            room = RoomMgr.createRoom(data.body.roomId);
            room.addOfferUser(UserMgr.getUser(data.header.token));
          } else {
            room.addAnswerUser(UserMgr.getUser(data.header.token));

            offer = room.getOfferUser();
            offer.send({
              header: {
                command: 'on_call_offer'
              },
              body: {
                answer: room.getAnswerUser().getToken()
              }
            });

            answer = room.getAnswerUser();
            answer.send({
              header: {
                command: 'on_call_answer'
              },
              body: {
                offer: room.getOfferUser().getToken()
              }
            });
          }
        } else if (data.header.command === "hangup") {
          offer = room.getOfferUser();
          answer = room.getAnswerUser();

          offer.send({
            header: {
              command: 'on_hangup'
            }
          });

          answer.send({
            header: {
              command: 'on_hangup'
            }
          });

        } else if (data.header.command === "offer_sdp") {
          answer = room.getAnswerUser();
          answer.send({
            header: {
              command: 'on_offer_sdp'
            },
            body: {
              sdp: data.body.sdp
            }
          });
        } else if (data.header.command === "answer_sdp") {
          offer = room.getOfferUser();
          offer.send({
            header: {
              command: 'on_answer_sdp'
            },
            body: {
              sdp: data.body.sdp
            }
          });
        } else if (data.header.command === "offer_candidate") {
          answer = room.getAnswerUser();
          answer.send({
            header: {
              command: 'on_offer_candidate'
            },
            body: {
              candidate: data.body.candidate
            }
          });
        } else if (data.header.command === "answer_candidate") {
          offer = room.getOfferUser();
          offer.send({
            header: {
              command: 'on_answer_candidate'
            },
            body: {
              candidate: data.body.candidate
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
