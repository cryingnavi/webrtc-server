const startButton1 = $('#startButton1');
const callButton1 = $('#callButton1');
const hangupButton1 = $('#hangupButton1');

const startButton2 = $('#startButton2');
const callButton2 = $('#callButton2');
const hangupButton2 = $('#hangupButton2');

const localVideo = $('#localVideo');
const remoteVideo = $('#remoteVideo');

var rtc = new RTC({
  //url: 'http://localhost:11200',
  //ws: 'ws://localhost:11200',
  url: 'https://test.studio-level9999.com',
  ws: 'wss://test.studio-level9999.com',
  localMediaTarget: 'localVideo',
  remoteMediaTarget: 'remoteVideo',
  'iceServers': [
    {
      'urls': 'stun:stun.l.google.com:19302'
    },
    {
      'urls': 'turn:192.158.29.39:3478?transport=udp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    },
    {
      'urls': 'turn:192.158.29.39:3478?transport=tcp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    }
  ]
});

rtc.on("localStream", function (stream) {
  localVideo.get(0).srcObject = stream;
});

rtc.on("remoteStream", function (stream) {
  remoteVideo.get(0).srcObject = stream;
});

rtc.on("error", function(message){
  console.log(message);
});

rtc.on("ready", function(roomId) {
  $("#roomId1").val(roomId);
  rtc.call(roomId);
});

rtc.on("hangup", function(roomId) {
  localVideo.get(0).srcObject = null;
  remoteVideo.get(0).srcObject = null;
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

hangupButton2.click(function () {
  rtc.hangUp();
});