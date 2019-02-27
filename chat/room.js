function Room (roomId) {
  this.roomId = roomId;
  this.users = [];
}

(function (_) {
  _.addUser = function (user) {
    this.users.push(user)
  };
  _.removeUser = function (u1) {
    var users = [];
    this.users = this.users.filter(function(u2){
      if (u1 === u2) {
        return false;
      }
      return true;
    });
  };
  _.broadcast = function (message) {
    var _self = this;
    this.users.forEach(function (user) {
      user.ws.send(message);
    });
  };
}(Room.prototype));


module.exports = Room
