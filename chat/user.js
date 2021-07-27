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
    console.log('send message =============');
    console.log(JSON.stringify(message));
    console.log('send message =============');
    try {
      this.ws.sendUTF(JSON.stringify(message));
    } catch (err) {
      console.log('send message error =============');
      console.log(err);
      console.log('send message error =============');
    }
    
  };
}(User.prototype));

module.exports = User
