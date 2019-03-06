function Room (roomId) {
  this.roomId = roomId;
  this.offer = null;
  this.answer = null;
}

(function (_) {
  _.addOfferUser = function (user) {
    this.offer = user;
  };
  _.addAnswerUser = function (user) {
    this.answer = user;
  };
  _.getOfferUser = function () {
    return this.offer;
  };
  _.getAnswerUser = function () {
    return this.answer;
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
}(Room.prototype));


module.exports = Room
