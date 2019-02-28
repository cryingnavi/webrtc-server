const startButton1 = $('#startButton1');
const callButton1 = $('#callButton1');
const hangupButton1 = $('#hangupButton1');

const startButton2 = $('#startButton2');
const callButton2 = $('#callButton2');
const hangupButton2 = $('#hangupButton2');

const localVideo = $('#localVideo');
const remoteVideo = $('#remoteVideo');

var rtc = new RTC({
  url: 'http://localhost:11200',
  ws: 'ws://localhost:11200',
  localMediaTarget: 'localVideo',
  removeMediaTarget: 'remoteVideo'
});

rtc.on("error", function(message){
  console.log(message);
});

rtc.on("ready", function(roomId) {
  $("#roomId1").val(roomId);
  rtc.call(roomId);
});

startButton1.click(function () {
  rtc.createLocalMedia();
});

callButton1.click(function () {
  rtc.ready();
});

hangupButton1.click(function () {
  rtc.hangUp();
});

startButton2.click(function () {
  rtc.createLocalMedia();
});

callButton2.click(function () {
  rtc.call($("#roomId2").val());
});
