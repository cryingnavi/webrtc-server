const uuidv4 = require('uuid/v4');
var WebSocketServer = require('websocket').server;
var RoomMgr = require("../chat/roomMgr")
var UserMgr = require("../chat/userMgr")

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
        console.log('--------------');
        console.log(message);
        console.log('--------------');
        
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
          if (!room) {
            return;
          }

          offer = room.getOfferUser();
          answer = room.getAnswerUser();

          if (offer) {
            offer.send({
              header: {
                command: 'on_hangup'
              }
            });
          }

          if (offer) {
            answer.send({
              header: {
                command: 'on_hangup'
              }
            });
          }

          RoomMgr.deleteRoom(data.body.roomId);
        } else if (data.header.command === "offer_sdp") {
          if (!room) {
            return;
          }

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
          if (!room) {
            return;
          }

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
          if (!room) {
            return;
          }

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
          if (!room) {
            return;
          }

          offer = room.getOfferUser();
          offer.send({
            header: {
              command: 'on_answer_candidate'
            }
          });

          console.log(JSON.stringify({
            header: {
              command: 'on_answer_candidate'
            },
            body: {
              candidate: data.body.candidate
            }
          }));
        }
      });

      conn.on('close', function(connection) {
        console.log('socket close');
      });

      conn.on('error', function(err) {
        console.log('socket error');
        console.log(err);
      });


      console.log('connect', uuid);

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
