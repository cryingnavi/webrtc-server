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
}(Room.prototype));


module.exports = Room
