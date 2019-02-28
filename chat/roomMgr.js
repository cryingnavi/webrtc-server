var Room = require('./room');

module.exports = {
  rooms: {},
  getRoom: function (roomId) {
    return this.rooms[roomId] || null;
  },
  createRoom: function (roomId) {
    this.rooms[roomId] = new Room(roomId);
    return this.rooms[roomId];
  },
  deleteRoom: function (roomId){
    delete this.rooms[roomId];
  }
};
