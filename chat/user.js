function User (token, ws) {
  this.token = token;
  this.ws = ws;
}

(function (_) {
  _.getToken = function () {
    return this.token;
  };
  _.send = function (message) {
    this.ws.sendUTF(JSON.stringify(message))
  };
}(User.prototype));

module.exports = User
