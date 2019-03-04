var User = require('./user');

module.exports = {
  users: {},
  getUser: function (userId) {
    return this.users[userId] || null;
  },
  createUser: function (userId, ws) {
    var user = this.users[userId] = new User(userId, ws);
    return user;
  },
  deleteUser: function (){

  }
};
