function User (userId, ws) {
  this.userId = userId;
  this.ws = ws;
}

(function (_) {
  _.getUserId = function () {
    return this.userId;
  };
  _.send = function (message) {
    this.ws.sendUTF(JSON.stringify(message))
  };
}(User.prototype));

module.exports = User
