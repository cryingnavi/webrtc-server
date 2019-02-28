var User = require('./user');

module.exports = {
  users: {},
  getUser: function (userId) {
    return this.users[userId] || null;
  },
  createUser: function (userId, ws) {
    return new User(userId, ws);
  },
  deleteUser: function (){

  }
};
