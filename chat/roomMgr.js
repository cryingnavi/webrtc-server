var Room = require('./room');

module.exports = {
  rooms: {},
  getRoom: function (roomId) {
    return this.rooms[roomId] || null;
  },
  createRoom: function (roomId) {
    return new Room(roomId);
  },
  deleteRoom: function (){

  }
};
