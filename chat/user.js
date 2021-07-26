function User (token, ws) {
  this.token = token;
  this.ws = ws;
  this.roomId = '';
}

(function (_) {
  _.getToken = function () {
    return this.token;
  };
  _.send = function (message) {
    console.log('==============');
    this.ws.sendUTF(JSON.stringify(message))
    console.log('==============');
  };
}(User.prototype));

module.exports = User
