const startButton1 = $('#startButton1');
const callButton1 = $('#callButton1');
const hangupButton1 = $('#hangupButton1');

const localVideo = $('#localVideo');
const remoteVideo = $('#remoteVideo');


function guid() {
  function s4() {
    return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

var userId = guid();

var rtc = new RTC({
  userId: userId,
  url: 'http://localhost:11200',
  ws: 'ws://localhost:11200',
  localMediaTarget: 'localVideo',
  removeMediaTarget: 'remoteVideo'
});

rtc.on("error", function(message){
  console.log(message);
});

rtc.on("ready", function(roomId) {
  this.call(roomId);
});

startButton1.click(function () {
  rtc.createLocal();
});

callButton1.click(function () {
  rtc.ready();
});

hangupButton1.click(function () {
  rtc.hangUp();
});
