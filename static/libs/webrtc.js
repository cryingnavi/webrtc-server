( function( global, factory ) {
	"use strict";
	if ( typeof module === "object" && typeof module.exports === "object" ) {
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "RTC requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}
} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {
"use strict";
var utils = { };
utils.browser = (function(){
	function getFirstMatch(regex) {
		var match = ua.match(regex);
		return (match && match.length > 1 && match[1]) || '';
	}

	var ua = navigator.userAgent,
		versionIdentifier = getFirstMatch(/version\/(\d+(\.\d+)?)/i),
		result = null;

	if(/chrome|crios|crmo/i.test(ua)){
		result = {
			name: 'chrome',
			version: getFirstMatch(/(?:chrome|crios|crmo)\/([\.1234567890]+)/i)
		};
	}
	else if (/opera|opr/i.test(ua)) {
		result = {
			name: 'opera',
			version: versionIdentifier || getFirstMatch(/(?:opera|opr)[\s\/]([\.1234567890]+)/i)
		};
	}
	else if(/msie|trident/i.test(ua)){
		result = {
			name: 'ie',
			version: getFirstMatch(/(?:msie |rv:)(\d+(\.\d+)?)/i)
		};
	}
	else if(/firefox|iceweasel/i.test(ua)){
		result = {
			name: 'firefox',
			version: getFirstMatch(/(?:firefox|iceweasel)[ \/]([\.1234567890]+)/i)
		};
	}
	else if(/safari/i.test(ua)){
		result = {
			name: 'safari',
			version: versionIdentifier
		};
	}

	return result;
})();

utils.platform = (function(){
	var userAgent = navigator.userAgent.toLowerCase();
	var platform = navigator.platform;

	var iPhone = /iPhone/i.test(platform),
		iPad = /iPad/i.test(platform),
		iPod = /iPod/i.test(platform);

	var win = /win/i.test(platform),
		mac = /mac/i.test(platform),
		linux = /linux/i.test(platform),
		iOs = iPhone || iPad || iPod;

	var android = /android/i.test(userAgent);

	if(win){
		return "windows";
	}
	else if(iOs){
		return "ios";
	}
	else if(android){
		return "android";
	}
	else if(mac){
		return "mac";
	}
	else if(linux){
		return "linux";
	}
})();

utils.Extend = function(sp, proto){
	var sb = function(){
		var args = Array.prototype.slice.call(arguments);
		this.initialize.apply(this, args);
	};

	var F = function(){ },
		spp = sp.prototype;

	F.prototype = spp;
	sb.prototype = new F();
	sb.prototype.constructor = sb;
	sb.base = spp;

	if (proto){
		for(var attr in proto){
			sb.prototype[attr] = proto[attr];
		}
	}

	sb.Extend = function(proto){
		var sp = this;
		return utils.Extend(sp, proto);
	};

	return sb;
};

utils.apply = function(target, copy){
	if(!target || !copy){
		throw new Error("Failed to execute 'apply' on 'utils': 2 arguments required, but only " + arguments.length + " present.");
	}

	if(typeof copy === "object"){
		if(typeof target === "number" || typeof target === "boolean" || typeof target === "string"){
			target = copy;
			return target;
		}
	}

	var attr = null;
	for(attr in copy){
		if(typeof copy[attr] === "object" && copy[attr] && !copy[attr].hasOwnProperty("length")){
			target[attr] = utils.apply(target[attr] || { }, copy[attr]);
		}
		else{
			target[attr] = copy[attr];
		}
	}
	return target;
};

var BaseKlass = function(){ };

utils.Event = utils.Extend(BaseKlass, {
	initialize: function(){
		this.listeners = { };
	},
	on: function(name, callback, context){
		var listeners = this.listeners[name] || (this.listeners[name] = [ ]);
		listeners.push({
			callback: callback,
			context: context
		});
		return this;
	},
	off: function(name, callback, context){
		var retain, ev, listeners, names = [], i, l;
		if (!name && !callback && !context) {
			return this;
		}

		listeners = this.listeners[name];
		if (listeners) {
			this.listeners[name] = retain = [];
			if (callback || context) {
				for (i = 0, l = listeners.length; i < l; i++) {
					ev = listeners[i];
					if ((callback && callback !== ev.callback) ||
							(context && context !== ev.context)) {
						retain.push(ev);
					}
				}
			}
			if (!retain.length) {
				delete this.listeners[name];
			}
		}
		return this;
	},
	fire: function(name){
		if (!this.listeners){
			return this;
		}

		var args = Array.prototype.slice.call(arguments, 1),
			listeners = this.listeners[name],
			i = -1;

		if (listeners){
			var ev = null;
			var len = listeners.length;
			switch (args.length) {
				case 0:
					if(len === 1){
						return (ev = listeners[0]).callback.call(ev.context);
					}
					else{
						while (++i < len){
							(ev = listeners[i]).callback.call(ev.context);
						}
						return this;
					}
					break;
				default:
					if(len === 1){
						return (ev = listeners[0]).callback.apply(ev.context, args);
					}
					else{
						while (++i < len){
							(ev = listeners[i]).callback.apply(ev.context, args);
						}
						return this;
					}
			}
		}
		return this;
	},
	clear: function(){
		this.listeners = { };
	},
	hasEvent: function(name){
		if(this.listeners[name]){
			return true;
		}
		return false;
	}
});

utils.bind = function(fn, context){
	if(!fn || !context){
		throw new Error("Failed to execute 'bind' on 'utils': 2 arguments required, but only " + arguments.length + " present.");
	}
	return function(){
		fn.apply(context, Array.prototype.slice.call(arguments));
	};
};

utils.fileDownload = function(blob, fileName){
	var doc = document,
		link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
		event = doc.createEvent("MouseEvents");

	link.href = URL.createObjectURL(blob);
	link.download = fileName;

	event.initEvent("click", true, false);
	link.dispatchEvent(event);
};

utils.createObjectURL = function(stream){
	return URL.createObjectURL(stream);
};

utils.blobWorkerSupport = (function(){
	try{
		var javascript = function(e){ }.toString(),
			blob = new Blob([
				"this.onmessage = " + javascript
			], {
				type: "application/javascript"
			});

		blob = URL.createObjectURL(blob);
		var w = new Worker(blob);
		URL.revokeObjectURL(blob);

		return true;
	}
	catch(e){
		return false;
	}
})();

utils.mediaRecorderSupport = function(stream){
	try{
		new MediaRecorder(stream);
		utils.mediaRecorderSupport = true;
	}
	catch(e){
		utils.mediaRecorderSupport = false;
	}
};


utils.ERROR = {
	"P1001": "Failed create offer sdp",
	"P1002": "Failed create answer sdp",
	"P1003": "Failed create offer sdp"
};

function request(options){
	var promise = new Promise(function (resolve, reject) {
		var req = new XMLHttpRequest();
		req.onreadystatechange = function(e) {
			var xhr = e.target,
				res = xhr.responseText;

			if (xhr.readyState === 4 && xhr.status === 200 && res) {
				try {
					res = JSON.parse(res);
					resolve(res);
				}
				catch(err) {
					reject(err);
				}
			}
			else if (xhr.readyState === 4 && xhr.status !== 200) {
				reject(e);
			}
		};

		req.open(options.method, options.url, true);
		if(options.contentType){
			req.setRequestHeader("Content-Type", options.contentType);
		}
		else{
			req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		}

		if(options.body){
			req.send(JSON.stringify(options.body));
		} else{
			req.send();
		}
	});
	return promise;
}

var Socket = utils.Extend(utils.Event, {
	initialize: function(ws){
		Socket.base.initialize.call(this);
		this.socket = new WebSocket(ws);
		this.setEvent();
	},
	setEvent: function(){
		this.socket.onopen = utils.bind(function(e){
			console.log('socket open', e);
			this.fire("open", e);
		}, this);
		this.socket.onclose = utils.bind(function(e){
			console.log('socket close', e);
			this.fire("close", e);
		}, this);
		this.socket.onerror = utils.bind(function(e){
			console.log('socket error', e);
			this.fire("error", e);
		}, this);
		this.socket.onmessage = utils.bind(function(e){
			console.log('socket message', e);
			this.fire("message", e);
		}, this);
	},
	send: function(data){
		try{
			this.socket.send(data);
		}
		catch(err){
			console.log('websoket send error ==========');
			console.log(err);
			console.log('websoket send error ==========');
		}
	},
	getReadyState: function(){
		return this.socket.readyState;
	},
	close: function(){
		if(this.socket){
			this.socket.close();
		}
	}
});

var Channeling = utils.Extend(utils.Event, {
	initialize: function(rtc, ws){
		Channeling.base.initialize.call(this);

		this.ws = ws;
		this.rtc = rtc;
		this.socket = null;

		this.createSocket();
	},
	createSocket: function(){
		try{
			this.socket = new Socket(this.ws);
			this.fire("createSocketSuccess");
		}
		catch(e){
			this.fire("createSocketError", e);
			return;
		}

		this.socket.on("open", utils.bind(function(e){
			this.fire("onOpen");
		}, this));
		this.socket.on("close", utils.bind(function(e){
		}, this));
		this.socket.on("error", utils.bind(function(e){

		}, this));
		this.socket.on("message", this.onMessage, this);
	},
	send: function(data){
		if(this.socket.getReadyState() === 1){
			this.socket.send(data);
		}
		else{

		}
	},
	serialize: function(data){
		var default_json = {
			header: {
				command: "",
				token: ""
			},
			body: { }
		};
		return JSON.stringify(utils.apply(default_json, data));
	},
	call: function (roomId) {
		var data = this.serialize({
			header: {
				command: "call",
				token: this.rtc.getTokenId()
			},
			body: {
				roomId: roomId
			}
		});

		this.send(data);
	},
	hangUp: function(roomId){
		var data = this.serialize({
			header: {
				command: "hangup"
			},
			body: {
				roomId: roomId
			}
		});

		this.send(data);
	},
	sendOfferSdp: function (sdp) {
		var data = this.serialize({
			header: {
				command: "offer_sdp",
				token: this.rtc.getOfferTokenId()
			},
			body: {
				roomId: this.rtc.getRoomId(),
				sdp: JSON.stringify(sdp)
			}
		});

		this.send(data);
	},
	sendAnswerSdp: function (sdp) {
		var data = this.serialize({
			header: {
				command: "answer_sdp",
				token: this.rtc.getAnswerTokenId()
			},
			body: {
				roomId: this.rtc.getRoomId(),
				sdp: JSON.stringify(sdp)
			}
		});

		this.send(data);
	},
	sendOfferCandidate: function (candidate) {
		var data = this.serialize({
			header: {
				command: "offer_candidate",
				token: this.rtc.getOfferTokenId()
			},
			body: {
				roomId: this.rtc.getRoomId(),
				candidate: JSON.stringify(candidate)
			}
		});

		this.send(data);
	},
	sendAnswerCandidate: function (candidate) {
		var data = this.serialize({
			header: {
				command: "answer_candidate",
				token: this.rtc.getAnswerTokenId()
			},
			body: {
				roomId: this.rtc.getRoomId(),
				candidate: JSON.stringify(candidate)
			}
		});

		this.send(data);
	},
	onMessage:  function (message) {
		var data = JSON.parse(message.data);
		var header = data.header;
		var body = data.body;
		var command = header.command.toUpperCase();

		switch(command){
			case "CONNECT":
				this.fire("onConnect", body.token);
				break;
			case "ON_CALL_OFFER":
				this.fire("onCallOffer", body.answer);
				break;
			case "ON_CALL_ANSWER":
				this.fire("onCallAnswer", body.offer);
				break;
			case "ON_OFFER_SDP":
				this.fire("onOfferSdp", JSON.parse(body.sdp));
				break;
			case "ON_ANSWER_SDP":
				this.fire("onAnswerSdp", JSON.parse(body.sdp));
				break;
			case "ON_OFFER_CANDIDATE":
				this.fire("onOfferCandidate", JSON.parse(body.candidate));
				break;
			case "ON_ANSWER_CANDIDATE":
				this.fire("onAnswerCandidate", JSON.parse(body.candidate));
				break;
			case "ON_HANGUP":
				this.fire("onHangUp");
				break;
		}
	}
});

var RTC = utils.Extend(utils.Event, {
	initialize: function(config){
		RTC.base.initialize.call(this);
		config = config || {};
		this.config = {
			url: '',
			ws: '',
			iceServers: null,
			userMedia: {
				audio: true,
				video: true
			},
			dataChannelEnabled: true,
			bandwidth: {
				video: 1500,
				data: 1638400
			},
			preferCodec: {
				audio: "opus",
				video: "VP9"
			},
			onlyTurn: false
		};
		utils.apply(this.config, config);

    if(!this.config.userMedia.audio && !this.config.userMedia.video && !this.config.dataChannelEnabled){
			alert('Error!!');
			return;
		}

		this.url = this.config.url;
		this.ws = this.config.ws;
		this.localMedia = null;
		this.remoteMedia = null;
    	this.calling = null;
		this.token = '';
		this.offerToken = '';
		this.offer = null;
		this.answerToken = '';
		this.answer = null;
		this.roomId = '';

		this.userMedia = {
			audio: this.config.userMedia.audio,
			video: this.config.userMedia.video
		};

		this.calling = new Channeling(this, this.ws);
		this.calling.on("onConnect", this.onConnect, this);
		this.calling.on("onCallOffer", this.onCallOffer, this);
		this.calling.on("onCallAnswer", this.onCallAnswer, this);
		this.calling.on("onOfferSdp", this.onOfferSdp, this);
		this.calling.on("onAnswerSdp", this.onAnswerSdp, this);
		this.calling.on("onOfferCandidate", this.onOfferCandidate, this);
		this.calling.on("onAnswerCandidate", this.onAnswerCandidate, this);
		this.calling.on("onHangUp", this.onHangUp, this);
	},
	getTokenId: function () {
		return this.token;
	},
	getOfferTokenId: function () {
		return this.offerToken;
	},
	getAnswerTokenId: function () {
		return this.answerToken;
	},
	getRoomId: function () {
		return this.roomId;
	},
  	createLocalMedia: function () {
    	navigator.mediaDevices.getUserMedia(this.userMedia).then(utils.bind(function(stream){
			this.localMedia = new Media(stream);
			this.fire("localStream", stream);
		}, this)).catch(utils.bind(function(e){
			this.fire("createLocal", {
				type: "createLocal",
				data: e
			});
		}, this));
	},
	ready: function () {
		request({
			url: this.url + '/roomReady',
			method: 'get'
		}).then(utils.bind(function(res){
			this.fire("ready", res.body.roomId);
		}, this)).catch(utils.bind(function(){
			this.fire("error", {
				type: "ready"
			});
		}, this));
	},
	call: function (roomId) {
		this.roomId = roomId;
		this.calling.call(roomId);
	},
	hangUp: function () {
		this.calling.hangUp(this.roomId);
	},
	createPeer: function (type) {
		var localStream = this.localMedia.getStream();

		var peerConfig = {
			iceServers: this.config.iceServers,
			dataChannelEnabled: this.config.dataChannelEnabled,
			bandwidth: this.config.bandwidth,
			preferCodec: this.config.preferCodec
		};

		var peer = new Peer(this, localStream, peerConfig);
		peer.on("sendOfferSdp", this.sendOfferSdp, this);
		peer.on("sendAnswerSdp", this.sendAnswerSdp, this);
		peer.on("addRemoteStream", this.addRemoteStream, this);
		//peer.on("signalEnd", this.signalEnd, this);
		peer.on("error", function(code, desc, data){
			//this.fire("error", code, desc, data);


		}, this);
		peer.on("stateChange", this._stateChange, this);

		if (type === 'offer') {
			console.log('offer ==========');
			peer.on("sendCandidate", this.sendOfferCandidate, this);
		} else {
			console.log('answer =========');
			peer.on("sendCandidate", this.sendAnswerCandidate, this);
		}
		return peer;
	},
	onConnect: function (token) {
		this.token = token;
	},
	onCallOffer: function (answerToken) {
		this.answerToken = answerToken;

		this.offer = this.createPeer('offer');
		this.offer.createOffer();
	},
	onCallAnswer: function (offerToken){
		this.offerToken = offerToken;
	},
	onOfferSdp: function (sdp) {
		this.answer = this.createPeer('answer');
		this.answer.createAnswer(sdp);
	},
	onAnswerSdp: function (sdp) {
		this.offer.receiveAnwserSdp(sdp);
	},
	onOfferCandidate: function (candidate) {
		this.answer.receiveCandidate(candidate);
	},
	onAnswerCandidate: function (candidate) {
		this.offer.receiveCandidate(candidate);
	},
	sendOfferSdp: function (sdp) {
		this.calling.sendOfferSdp(sdp);
	},
	sendAnswerSdp: function (sdp) {
		this.calling.sendAnswerSdp(sdp);
	},
	sendOfferCandidate: function (candidate) {
		this.calling.sendOfferCandidate(candidate);
	},
	sendAnswerCandidate: function (candidate) {
		this.calling.sendAnswerCandidate(candidate);
	},
	addRemoteStream: function (stream) {
		this.remoteMedia = new Media(stream);
		this.fire("remoteStream", stream);
	},
	onHangUp: function () {
		if (this.offer) {
			this.offer.close();
			this.offer = null;
		}

		if (this.answer) {
			this.answer.close();
			this.answer = null;
		}
		
		this.fire("hangup");
	}
});


var Peer = utils.Extend(utils.Event, {
	initialize: function(obj, localStream, config){
		Peer.base.initialize.call(this);

		this.config = utils.apply({
			iceServers: null,
			dataChannelEnabled: false,
			bandwidth: {
				audio: 32,
				video: 1500,
				data: 1638400
			},
			preferCodec: {
				audio: "opus",
				video: "H264"
			}
		}, config);

		this.call = obj;
		this.localStream = localStream;
		this.connected = false;
		this.oldStats = null;
		this.statsReportTimer = null;
		this.remoteMediaStream = new MediaStream();
	},
	setEvent: function(){
		var pc = this.pc;
		pc.onicecandidate = utils.bind(function(e){
			if(e.candidate){
				this.fire("sendCandidate", e.candidate);
			}
		}, this);

		pc.ontrack = utils.bind(function(e){
			console.log(e);
			this.remoteMediaStream.addTrack(e.track);
			//this.fire("addRemoteStream", e.streams[0]);
			this.fire("addRemoteStream", this.remoteMediaStream);
		}, this);

		pc.onsignalingstatechange = utils.bind(function(e){
			console.log('=====');
			console.log(e);
			console.log('=====');
			this.fire("signalingstatechange", e);
		}, this);

		pc.oniceconnectionstatechange = utils.bind(function(e){
			console.log('----');
			console.log(e);
			console.log('----');
			this.fire("iceconnectionstatechange", e);
		}, this);

		pc.onremovestream = utils.bind(function(e){
			this.fire("removestream", e);
		}, this);

		pc.onclose = utils.bind(function(e){
			this.fire("close", e);
		}, this);
	},
	createPeerConnection: function(){
		this.pc = new RTCPeerConnection({
			iceServers: this.config.iceServers
		});

		this.setEvent();
		if(this.localStream){
			var me = this;
			this.localStream.getTracks().forEach(function (track) {
				me.pc.addTrack(track, me.localStream);
			});
		}

		if(utils.dataChannelSupport && this.config.dataChannelEnabled){
			this.data = new Data(this);
			this.data.on("open", utils.bind(function(){
				//this.call.playRtc.fire("addDataStream", this.id, this.uid, this.data);
			}, this));
			this.data.on("close", utils.bind(function(){

			}, this));
			this.data.on("error", utils.bind(function(){

			}, this));
		}
		else{
			//에러
		}
	},
	replaceBandWidth: function(sdp, media, bandwidth){
		if(!this.config.bandwidth){
			return sdp;
		}

		var modifier = 'AS';
		if (adapter.browserDetails.browser === 'firefox') {
	    bandwidth = (bandwidth >>> 0) * 1000;
	    modifier = 'TIAS';
	  }

		var lines = sdp.split("\n");
	  var line = -1;
	  for (var i = 0; i < lines.length; i++) {
	    if (lines[i].indexOf("m=" + media) === 0) {
	      line = i;
	      break;
	    }
	  }
	  if (line === -1) {
	    return sdp;
	  }

	  line++;

	  while(lines[line].indexOf("i=") === 0 || lines[line].indexOf("c=") === 0) {
	    line++;
	  }

	  if (lines[line].indexOf("b") === 0) {
			lines[line] = "b=" + modifier + ":" + bandwidth;
	    return lines.join("\n");
	  }

	  var newLines = lines.slice(0, line);
	  newLines.push("b=" + modifier + ":" + bandwidth);
	  newLines = newLines.concat(lines.slice(line, lines.length));
	  return newLines.join("\n");
	},
	replacePreferCodec: function(sdp, mLineReg, preferCodec){
		var mLine,
			newMLine = [],
			sdpCodec,
			mLineSplit,
			reg = new RegExp("a=rtpmap:(\\d+) " + preferCodec + "/\\d+");

		mLine = sdp.match(mLineReg);
		if(!mLine){
			return sdp;
		}

		sdpCodec = sdp.match(reg);
		if(!sdpCodec){
			return sdp;
		}

		mLine = mLine[0];
		sdpCodec = sdpCodec[1];

		mLineSplit = mLine.split(" ");
		newMLine.push(mLineSplit[0]);
		newMLine.push(mLineSplit[1]);
		newMLine.push(mLineSplit[2]);
		newMLine.push(sdpCodec);

		for(var i=3; i<mLineSplit.length; i++){
			if(mLineSplit[i] !== sdpCodec){
				newMLine.push(mLineSplit[i]);
			}
		}

		return sdp.replace(mLine, newMLine.join(" "));
	},
	_getSdpOptions: function(){
		var constraints;
		if(utils.browser.name === "firefox"){
			constraints = {
				offerToReceiveAudio: this.call.userMedia.audio,
				offerToReceiveVideo: this.call.userMedia.video
			};
		}
		else{
			constraints = {
				offerToReceiveAudio: this.call.userMedia.audio,
				offerToReceiveVideo: this.call.userMedia.video
			};
		}
		return constraints;
	},
	createOffer: function(){
		this.createPeerConnection();
		this.pc.createOffer(this._getSdpOptions()).then(utils.bind(function(sessionDesc) {
			sessionDesc.sdp = this.replaceBandWidth(sessionDesc.sdp, "audio", this.config.bandwidth.audio);
			sessionDesc.sdp = this.replaceBandWidth(sessionDesc.sdp, "video", this.config.bandwidth.video);
			sessionDesc.sdp = this.replaceBandWidth(sessionDesc.sdp, "application", this.config.bandwidth.data);
			sessionDesc.sdp = this.replacePreferCodec(sessionDesc.sdp, /m=audio(:?.*)?/, this.config.preferCodec.audio);
			sessionDesc.sdp = this.replacePreferCodec(sessionDesc.sdp, /m=video(:?.*)?/, this.config.preferCodec.video);

			this.pc.setLocalDescription(sessionDesc).then(utils.bind(function () {
				this.fire("sendOfferSdp", sessionDesc);
			}, this));

		}, this), utils.bind(function(){
			//에러

			this.fire("");
		}, this));
	},
	createAnswer: function(sdp){
		if(!this.pc){
			this.createPeerConnection();
		}
		var me = this,
			pc = this.pc;

		pc.setRemoteDescription(sdp).then(utils.bind(function(){
			pc.createAnswer(this._getSdpOptions()).then(utils.bind(function(sessionDesc){
				sessionDesc.sdp = this.replaceBandWidth(sessionDesc.sdp, "audio", this.config.bandwidth.audio);
				sessionDesc.sdp = this.replaceBandWidth(sessionDesc.sdp, "video", this.config.bandwidth.video);
				sessionDesc.sdp = this.replaceBandWidth(sessionDesc.sdp, "application", this.config.bandwidth.data);
				sessionDesc.sdp = this.replacePreferCodec(sessionDesc.sdp, /m=audio(:?.*)?/, this.config.preferCodec.audio);
				sessionDesc.sdp = this.replacePreferCodec(sessionDesc.sdp, /m=video(:?.*)?/, this.config.preferCodec.video);

				this.pc.setLocalDescription(sessionDesc);
				this.fire("sendAnswerSdp", sessionDesc);
			}, this), utils.bind(function(e){
				//에러
			}, this));
		}, this)).catch(utils.bind(function(e){

		}, this));
	},
	receiveAnwserSdp: function(sdp){
		var pc = this.pc;
		pc.setRemoteDescription(sdp).catch(function(){

		});
	},
	receiveCandidate: function(candidate){
		if(!this.pc){
			this.createPeerConnection();
		}

		var pc = this.pc;
		pc.addIceCandidate(candidate).catch(function (e) {
			//error
		});
	},
	close: function(){
		if(this.pc){
			this.pc.close();
		}
		this.pc = null;
	},
	getDataChannel: function(){
		return this.data;
	},
	getLocalMedia: function(){
		if(this.localMedia){
			return this.localMedia;
		}
		return null;
	},
	getRemoteMedia: function(){
		if(this.remoteMedia){
			return this.remoteMedia;
		}
		return null;
	},
	getPeerConnection: function(){
		return this.pc;
	},
	getStats: function(fn){
		if(utils.browser.name === "firefox"){
			this.pc.getStats(null, utils.bind(function(res){
				fn.call(this, res);
			}, this), function(){ });
		}
		else{
			this.pc.getStats(utils.bind(function(res){
				var items = [ ];
				res.result().forEach(function (result) {
					var item = { };
					result.names().forEach(function (name) {
						item[name] = result.stat(name);
					});
					item.id = result.id;
					item.type = result.type;
					item.timestamp = result.timestamp;

					items.push(item);
				});

				fn.call(this, items);
			}, this));
		}
	}
});


var Media = (function(){
	var Recorder = function(stream, type){
		this.type = type;
		this.stream = stream;
		this.recordingCb = null;
		this.stopCb = null;

		this.mr = new MediaRecorder(this.stream);
		this.array = [];
		this.mr.ondataavailable = utils.bind(function(e){
			this.array.push(e.data);
			if(this.recordingCb){
				this.recordingCb(e.data);
			}
		}, this);

		this.mr.onstop = utils.bind(function(e){
			var encodeData = new Blob(this.array, {type: this.type});
			if(this.stopCb){
				this.stopCb(encodeData);
			}
			this.stopCb = null;
		}, this);
	};

	Recorder.prototype.start = function(recordingCb){
		this.recordingCb = recordingCb;
		this.mr.start(3000);
	};

	Recorder.prototype.stop = function(stopCb){
		this.stopCb = stopCb;
		this.mr.stop();
	};

	return utils.Extend(utils.Event, {
		initialize: function(stream){
			Media.base.initialize.call(this);
			this.stream = stream;
			this.recorder = null;
		},
		createRecorder: function(){
			if(!utils.mediaRecorderSupport){
				//
			}

			var recorder = null,
				stream = this.getStream();
				videoTrack = this.getVideoTrack();

			if(videoTrack){
				recorder = new Recorder(stream, "video/webm");
			}
			else{
				recorder = new Recorder(stream, "audio/ogg; codecs=opus");
			}

			return recorder;
		},

		record: function(recordingCb){
			if(this.recorder){
				return;
			}
			this.recorder = this.createRecorder();
			if(this.recorder){
				this.recorder.start(recordingCb);
			}
		},
		recordStop: function(stopCb){
			if(!this.recorder){
				return;
			}

			this.recorder.stop(stopCb);
			this.recorder = null;
		},
		getStream: function(){
			return this.stream;
		},
		getVideoTrack: function(){
			var s = this.getStream(),
				v = s.getVideoTracks();

			return v.length > 0 ? v[0] : null;
		},
		getAudioTrack: function(){
			var s = this.getStream(),
				a = s.getAudioTracks();

			return a.length > 0 ? a[0] : null;
		},
		audioMute: function(enabled){
			var a = this.getAudioTrack();
			if(a){
				a.enabled = enabled;
				return true;
			}
			return false;
		},
		videoMute: function(enabled){
			var v  = this.getVideoTrack();
			if(v){
				v.enabled = enabled;
				return true;
			}
			return false;
		},
		mute: function(enabled){
			this.audioMute(enabled);
			this.videoMute(enabled);
		},
		stop: function(){
			var v = this.getVideoTrack();
			var a = this.getAudioTrack();

			if(v){
				v.stop();
			}

			if(a){
				a.stop();
			}

			//chrome 47 deprecation.
			if(this.stream.stop){
				this.stream.stop();
			}
		}
	});
})();


var Data = (function(){
	if(!utils.blobWorkerSupport){
		return false;
	}

	var TYPE = {
		0: "text",
		1: "binary"
	};

	var HEADERTYPE = {
		0: "master",
		1: "frag"
	};

	function getUniqId(){
		return new Date().getTime();
	}

	function concatBuffer(buf1, buf2){
		var tmp = new Uint8Array(buf1.byteLength + buf2.byteLength);
		tmp.set(new Uint8Array(buf1), 0);
		tmp.set(new Uint8Array(buf2), buf1.byteLength);
		return tmp.buffer;
	}

	var TextReceiveDatas = { };
	var FileReceiveDatas = { };

	return utils.Extend(utils.Event, {
		initialize: function(peer){
			Data.base.initialize.call(this);

			this.peer = peer;
			this.sending = false;
			this.queue = [];
			this.dataChannel = this.peer.getPeerConnection().createDataChannel("channel", {
				id: 1
			});
			this.fileReceiveStartTime = 0;

			this.dataChannel.binaryType = "arraybuffer";

			this.setEvent();
		},
		setEvent: function(){
			var dc = this.dataChannel;
			dc.onopen = utils.bind(function(e){
				this.fire("open", e);
			}, this);

			dc.onclose = utils.bind(function(e){
				this.fire("close", e);
			}, this);

			dc.onerror = utils.bind(function(e){


				/**
				 * �곗씠�곕� 二쇨퀬 諛쏆쓣 �� �먮윭媛� 諛쒖깮�섎㈃ �대깽�멸� �몄텧�쒕떎.
				 * @event error
				 * @memberof Data.prototype
				 * @param {Object} err �먮윭 媛앹껜 �먮뒗 臾몄옄�댁쓣 �꾨떖 諛쏅뒗��. DataChannel �� �먮윭 �대깽�멸� �몄텧�섎㈃ �먮윭 媛앹껜媛� �꾨떖�섍퀬 �꾩넚 �먮뒗 �곗씠�곕� 諛쏆븯�� �� �뚯떛怨쇱젙�먯꽌 �먮윭媛� �섎㈃ SEND_ERROR, RECEIVE_ERROR 臾몄옄�댁쓣 �꾨떖 諛쏅뒗��.
				 * @example
				 	dc.on("error", function(err){

				 	});
				 */
				this.fire("error", e);
			}, this);

			function onmessage(data){
				var dv = new DataView(data),
					id = dv.getFloat64(0),
					type = null;

				/* MCU DataChannel ���� Header(Master Block) �뺣낫 �섏젙 (jun, 2016.11.17)
				* sender platform(this.peer.peers.platformtype) : windows / mac / linux / ios / android
				* sender current version(this.peer.peers.sdkversion) : PLATFORM_VERSION[platform]
				* versionCheck : utils.versionCompare(sender version, PLATFORM_VERSION[sender platform]) - lower version : -1, exact version : 0, higher version : 1
				* �곸슜 SDK web(windows, mac, linux) : 2.2.17 �댁긽, ios : 2.2.8 �댁긽, android : 2.2.9 �댁긽*/
				var versionCheck = utils.versionCompare(this.peer.peers.sdkversion, PLATFORM_VERSION[this.peer.peers.platformtype], this.peer.call.playRtc.channelType);	//lower version : -1, exact version : 0, higher version : 1

				if(versionCheck === -1) {
					type = dv.getInt32(20);
				} else {
					type = dv.getInt32(54);
				}

				try{
					if(TextReceiveDatas[id]){
						this.textReceive(id, dv, data);
					}
					else if(FileReceiveDatas[id]){
						this.fileReceive(id, dv, data);
					}
					else{
						if(TYPE[type] === "text"){
							this.textReceive(id, dv, data);
						}
						else{
							this.fileReceive(id, dv, data);
						}
					}
				}
				catch(e){
					this.fire("error", e);
				}
			};

			dc.onmessage = utils.bind(function(e){
				onmessage.call(this, e.data);
			}, this);
		},
		send: function(message, success, error){
			if(message.size && message.name){
				if(!this.sending){
					this.sendFile(message, success, error);
				}
				else{
					this.queue.push({
						message: message,
						success: success,
						error: error
					});
				}

				this.sending = true;
			}
			else{
				message = message.toString();
				this.sendText(message, success, error);
			}
		},
		bufferedSend: function(message){
			var dc = this.dataChannel;
			try{
				dc.send(message);
			}
			catch(e){
				return false;
			}

			return true;
		},
		sendText: function(text, success, error){
			var dc = this.dataChannel,
				id = getUniqId(),
				tokenId = this.peer.call.getToken(),		// Header(Master Block) �뺣낫 �섏젙 (jun, 2016.11.17)
				fragHbuf = new ArrayBuffer(20),
				fragDv = new DataView(fragHbuf),
				buf = new ArrayBuffer(text.length * 2),
				view = new Uint8Array(buf),
				i = 0,
				char = null,
				len = text.length,
				j = 0,
				totalSize = buf.byteLength,
				arr, hbuf, dv, fragCount;

				fragDv.setFloat64(0, id);
				fragDv.setInt32(8, 1);

			var send = utils.bind(function(hbuf, arr, index){
				var bbuf = arr[index];

				this.fire("sending", {
					id: id,
					type: "text",
					totalSize: totalSize,
					fragSize: arr[index].byteLength,
					fragCount: fragCount,
					fragIndex: index
				});

				if(!this.bufferedSend(concatBuffer(hbuf, bbuf))){
					//error
					if(error){
						error(text);
					}
					return;
				}

				if((index + 1) < arr.length){
					window.setTimeout(function(){
						var i = index + 1;
						fragDv.setInt32(12, i);
						fragDv.setInt32(16, arr[i].byteLength);

						send(fragDv.buffer, arr, i);
					}, 100);
				}
				else{
					//success
					if(success){
						success(text);
					}
				}
			}, this);

			for(;i < len; i++) {
				char = text.charCodeAt(i);
				view[j] = char >>> 8;
				view[j + 1] = char & 0xFF;
				j = j + 2;
			}

			/* MCU DataChannel ���� Header(Master Block) �뺣낫 �섏젙 (jun, 2016.11.17)
			* sender platform(this.peer.peers.platformtype) : windows / mac / linux / ios / android
			* sender current version(this.peer.peers.sdkversion) : PLATFORM_VERSION[platform]
			* versionCheck : utils.versionCompare(sender version, PLATFORM_VERSION[sender platform]) - lower version : -1, exact version : 0, higher version : 1
			* �곸슜 SDK web(windows, mac, linux) : 2.2.17 �댁긽, ios : 2.2.8 �댁긽, android : 2.2.9 �댁긽*/
			var versionCheck = utils.versionCompare(this.peer.peers.sdkversion, PLATFORM_VERSION[this.peer.peers.platformtype], this.peer.call.playRtc.channelType);	//lower version : -1, exact version : 0, higher version : 1

			var arr = this.packetSplit(buf, 8192);
			if(versionCheck === -1) {
				hbuf = new ArrayBuffer(36);
			} else {
				hbuf = new ArrayBuffer(70);
			}
			dv = new DataView(hbuf);

			fragCount = arr.length;

			var pos = 0;

			dv.setFloat64(pos, id);				// �곗씠�� �꾩씠��( 8 byte) : long �꾩넚 �곗씠�� �ㅽ듃由쇱쓽 怨좎쑀 �꾩씠��
			pos += 8;
			dv.setInt32(pos, 0);					// �ㅻ뜑 ����(4 byte) : int, Master/Frag Block Header Type, 0: Master
			pos += 4;
			if(versionCheck !== -1) {
				// Sender �꾩씠��(34 byte) : �곗씠�� �꾩넚 �ъ슜�� �꾩씠�� 17��(Token ID)
				var i = pos, j = 0;
				pos += 34;
				for (; i<pos; i=i+2) {
					tmp = tokenId.charCodeAt(j);
					if(tmp){
						dv.setUint8(i, tmp >>> 8);
						dv.setUint8(i+1, tmp & 0xFF);
					}
					j++;
				}
			}
			dv.setFloat64(pos, totalSize);		// �곗씠�� �ш린( 8 byte) : long, Application �곗씠�� �꾩껜 �ш린
			pos += 8;
			dv.setInt32(pos, 0);					// �곗씠�� �좏삎(4 byte) : int, 0 : �띿뒪��, 1 : �뚯씪
			pos += 4;
			dv.setInt32(pos, fragCount);		// Block Count(4 byte) : int, �꾩껜 �곗씠�� Block ��
			pos += 4;
			dv.setInt32(pos, 0);					// Block Index(4 byte) : �꾩넚�섎뒗 Block�� index
			pos += 4;
			dv.setInt32(pos, arr[0].byteLength);	// Block �곗씠�� �ш린(4 byte) : int, �꾩넚�섎뒗 Application Data�� �ш린

			send(dv.buffer, arr, 0);
		},
		sendFile: function(file, success, error){
			var dc = this.dataChannel,
				id = getUniqId(),
				tokenId = this.peer.call.getToken(),		// Header(Master Block) �뺣낫 �섏젙 (jun, 2016.11.17)
				fileName = file.name,
				mimeType = file.type,
				chunkSize = 8192,
				me = this,
				index = 0,
				totalSize = file.size,
				fragCount = Math.ceil(totalSize / chunkSize);

			/* MCU DataChannel ���� Header(Master Block) �뺣낫 �섏젙 (jun, 2016.11.17)
			* sender platform(this.peer.peers.platformtype) : windows / mac / linux / ios / android
			* sender current version(this.peer.peers.sdkversion) : PLATFORM_VERSION[platform]
			* versionCheck : utils.versionCompare(sender version, PLATFORM_VERSION[sender platform]) - lower version : -1, exact version : 0, higher version : 1
			* �곸슜 SDK web(windows, mac, linux) : 2.2.17 �댁긽, ios : 2.2.8 �댁긽, android : 2.2.9 �댁긽*/
			var versionCheck = utils.versionCompare(this.peer.peers.sdkversion, PLATFORM_VERSION[this.peer.peers.platformtype], this.peer.call.playRtc.channelType);	//lower version : -1, exact version : 0, higher version : 1

			if(versionCheck === -1) {
				var mbuf = new ArrayBuffer(548);
			} else {
				var mbuf = new ArrayBuffer(582);
			}

			var mdv = new DataView(mbuf),
				tmp = null;

			var pos = 0;

			mdv.setFloat64(pos, id);				// �곗씠�� �꾩씠��( 8 byte) : long �꾩넚 �곗씠�� �ㅽ듃由쇱쓽 怨좎쑀 �꾩씠��
			pos += 8;
			mdv.setInt32(pos, 0);					// �ㅻ뜑 ����(4 byte) : int, Master/Frag Block Header Type, 0: Master
			pos += 4;
			if(versionCheck !== -1) {
				// Sender �꾩씠��(34 byte) : �곗씠�� �꾩넚 �ъ슜�� �꾩씠�� 17��(Token ID)
				var i = pos, j = 0;
				pos += 34;
				for (; i<pos; i=i+2) {
					tmp = tokenId.charCodeAt(j);
					if(tmp){
						mdv.setUint8(i, tmp >>> 8);
						mdv.setUint8(i+1, tmp & 0xFF);
					}
					j++;
				}
			}

			mdv.setFloat64(pos, totalSize);		// �곗씠�� �ш린( 8 byte) : long, Application �곗씠�� �꾩껜 �ш린
			pos += 8;
			mdv.setInt32(pos, 1);					// �곗씠�� �좏삎(4 byte) : int, 0 : �띿뒪��, 1 : �뚯씪
			pos += 4;

			var i = pos, j = 0;
			pos += 256;
			for (; i<pos; i=i+2) {
				tmp = fileName.charCodeAt(j);
				if(tmp){
					mdv.setUint8(i, tmp >>> 8);
					mdv.setUint8(i+1, tmp & 0xFF);
				}
				j++;
			}

			var i = pos, j = 0;
			pos += 256;
			for (; i<pos; i=i+2) {
				tmp = mimeType.charCodeAt(j);
				if(tmp){
					mdv.setUint8(i, tmp >>> 8);
					mdv.setUint8(i+1, tmp & 0xFF);
				}
				j++;
			}

			mdv.setInt32(pos, fragCount);		// Block Count(4 byte) : int, �꾩껜 �곗씠�� Block ��
			pos += 4;
			mdv.setInt32(pos, index);				// Block Index(4 byte) : �꾩넚�섎뒗 Block�� index
			pos += 4;
			// Block �곗씠�� �ш린(4 byte) : int, �꾩넚�섎뒗 Application Data�� �ш린
			if(totalSize < chunkSize){
				mdv.setInt32(pos, totalSize);
			}
			else{
				mdv.setInt32(pos, chunkSize);
			}

			var fbuf = new ArrayBuffer(20),
				fdv = new DataView(fbuf);

			fdv.setFloat64(0, id);
			fdv.setInt32(8, 1);

			function send(offset){
				var reader = new FileReader(),
					size = 0,
					hbuf = null;

				size = offset + chunkSize;
				reader.onload = utils.bind(function(e){
					if(offset === 0){
						hbuf = mdv.buffer;
					}
					else{
						index++;
						fdv.setInt32(12, index);
						fdv.setInt32(16, e.target.result.byteLength);
						hbuf = fdv.buffer;
					}

					me.fire("sending", {
						id: id,
						type: "binary",
						fileName: fileName,
						mimeType: mimeType,
						totalSize: totalSize,
						fragSize: e.target.result.byteLength,
						fragCount: fragCount,
						fragIndex: index
					});

					me.bufferedSend(concatBuffer(hbuf, e.target.result));
					if (totalSize > offset + e.target.result.byteLength) {
						if(dc.bufferedAmount !== 0){
							var interval = window.setInterval(function(){
								if(dc.bufferedAmount === 0){
									window.clearInterval(interval);
									interval = null;

									send(size);
								}
							}, 0);
						}
						else{
							send(size);
						}
					}
					else{
						me.sending = false;
						//success
						if(success){
							success(file);
						}

						nextData = me.queue.pop();
						if(nextData){
							me.send(nextData.message, nextData.success, nextData.error);
						}
					}
				}, this);

				var slice = file.slice(offset, size);
				reader.readAsArrayBuffer(slice);
			};

			send(0);
		},
		textReceive: function(id, dv, data){
			var progress = { },
				body = null,
				headerType = dv.getInt32(8);

			progress.peerId = this.peer.id;
			if(HEADERTYPE[headerType] === "master"){
				/* MCU DataChannel ���� Header(Master Block) �뺣낫 �섏젙 (jun, 2016.11.17)
				* sender platform(this.peer.peers.platformtype) : windows / mac / linux / ios / android
				* sender current version(this.peer.peers.sdkversion) : PLATFORM_VERSION[platform]
				* versionCheck : utils.versionCompare(sender version, PLATFORM_VERSION[sender platform]) - lower version : -1, exact version : 0, higher version : 1
				* �곸슜 SDK web(windows, mac, linux) : 2.2.17 �댁긽, ios : 2.2.8 �댁긽, android : 2.2.9 �댁긽*/
				var versionCheck = utils.versionCompare(this.peer.peers.sdkversion, PLATFORM_VERSION[this.peer.peers.platformtype], this.peer.call.playRtc.channelType);	//lower version : -1, exact version : 0, higher version : 1
				progress.id = id;

				if(versionCheck ===-1) {
					progress.totalSize = dv.getFloat64(12);
					progress.fragCount = dv.getInt32(24);
					progress.fragIndex = dv.getInt32(28);
					progress.fragSize = dv.getInt32(32);

					body = data.slice(36);
				} else {
					var tempSenderId = "";

					var tmp = null;
					var i = 12;
					for(; i<46; i = i+2){
						tmp = String.fromCharCode(dv.getInt16(i));
						if(tmp.charCodeAt(0) !== 0){
							tempSenderId = tempSenderId + tmp;
						}
					}
					this.senderId = tempSenderId;

					progress.totalSize = dv.getFloat64(46);
					progress.fragCount = dv.getInt32(58);
					progress.fragIndex = dv.getInt32(62);
					progress.fragSize = dv.getInt32(66);

					body = data.slice(70);
				}

				TextReceiveDatas[id] = [];
				TextReceiveDatas[id].totalSize = progress.totalSize;
				TextReceiveDatas[id].fragCount = progress.fragCount;
				TextReceiveDatas[id].push(body);
			}
			else{
				progress.id = id;
				progress.type = "text";
				progress.totalSize = TextReceiveDatas[id].totalSize;
				progress.fragCount = TextReceiveDatas[id].fragCount;
				progress.fragIndex = dv.getInt32(12);
				progress.fragSize = dv.getInt32(16);

				body = data.slice(20);
				TextReceiveDatas[id].push(body);
			}

			/**
			 * DataChannel �� �듯빐 �쒕줈 �곗씠�곕� 二쇨퀬 諛쏆쓣 ��, �곷�諛⑹씠 蹂대궦 �곗씠�곗쓽 �묒씠 �� 寃쎌슦 �대� 遺꾪븷�섏뿬 �꾩넚 諛쏅뒗��. �� 寃쎌슦 �꾩껜 硫붿떆吏��� �ш린�� �꾩옱 諛쏆� �ш린瑜� �ㅻ뜑 �뺣낫�� �ы븿�섍쾶 �쒕떎. Progress �대깽�몃뒗 �� �ㅻ뜑 �뺣낫瑜� 諛뷀깢�쇰줈 �ъ슜�먯뿉寃� progress �� �� �덇쾶 �댁���.
			 * @event progress
			 * @memberof Data.prototype
			 * @param {Object} data
			 * @example
			 	dc.on("progress", function(data){

			 	});
			 */

			if(versionCheck !==-1) {
				if(this.senderId !== null){
					progress.peerId = this.senderId;
				}
			}

			this.fire("progress", progress);

			if((progress.fragCount - 1) === progress.fragIndex){
				try{
					var totLength = TextReceiveDatas[id].length,
						textData = TextReceiveDatas[id],
						buf = new ArrayBuffer(0),
						view = null,
						chars = [],
						i = 0,
						len = 0;

					for(; i<totLength; i++) {
						buf = concatBuffer(buf, textData[i]);
					}

					i = 0;
					view = new Uint8Array(buf);
					len = buf.byteLength;
					for(; i < len;) {
						chars.push(((view[i++] & 0xff) << 8) | (view[i++] & 0xff));
					}

					if(!this.hasEvent("message")){
						//
					}

					/**
					 * DataChannel �� �듯빐 �쒕줈 �곗씠�곕� 二쇨퀬 諛쏆쓣 ��, �곷�諛⑹씠 蹂대궦 �곗씠�곕� �섏떊�섎뒗 �대깽�몄씠��.
					 * @event message
					 * @memberof Data.prototype
					 * @param {Object} data
					 * @example
					 	dc.on("message", function(data){

					 	});
					 */
					var PeerID = '';
					if(versionCheck ===-1) {
						PeerID = this.peer.id;
					} else {
						PeerID = this.senderId;
					}

					this.fire("message", {
						type: "text",
						id: id,
						peerId: PeerID,
						totalSize: textData.totalSize,
						data: String.fromCharCode.apply(null, chars)
					});
				}
				catch(e){
					this.fire("error", e);
				}
			}
		},
		fileReceive: function(id, dv, data){
			var progress = { },
				body = null,
				headerType = dv.getInt32(8),
				blob = null,
				tmp = null,
				totLength = null,
				buffer = null,
				blob = null;

			progress.peerId = this.peer.id;
			if(HEADERTYPE[headerType] === "master"){
				/* MCU DataChannel ���� Header(Master Block) �뺣낫 �섏젙 (jun, 2016.11.17)
				* sender platform(this.peer.peers.platformtype) : windows / mac / linux / ios / android
				* sender current version(this.peer.peers.sdkversion) : PLATFORM_VERSION[platform]
				* versionCheck : utils.versionCompare(sender version, PLATFORM_VERSION[sender platform]) - lower version : -1, exact version : 0, higher version : 1
				* �곸슜 SDK web(windows, mac, linux) : 2.2.17 �댁긽, ios : 2.2.8 �댁긽, android : 2.2.9 �댁긽*/
				var versionCheck = utils.versionCompare(this.peer.peers.sdkversion, PLATFORM_VERSION[this.peer.peers.platformtype], this.peer.call.playRtc.channelType);	//lower version : -1, exact version : 0, higher version : 1

				if(versionCheck ===-1) {
					progress.totalSize = dv.getFloat64(12);

					progress.fileName = "";
					i = 24;
					for(; i<280; i = i+2){
						tmp = String.fromCharCode(dv.getInt16(i));
						if(tmp.charCodeAt(0) !== 0){
							progress.fileName = progress.fileName + tmp;
						}
					}

					progress.mimeType = "";
					i = 280;
					for(; i<536; i = i+2){
						tmp = String.fromCharCode(dv.getInt16(i));
						if(tmp.charCodeAt(0) !== 0){
							progress.mimeType = progress.mimeType + tmp;
						}
					}

					progress.id = id;
					progress.fragCount = dv.getInt32(536);
					progress.fragIndex = dv.getInt32(540);
					progress.fragSize = dv.getInt32(544);

					body = data.slice(548);
				} else {
					var tempSenderId = "";

					i = 12;
					for(; i<46; i = i+2){
						tmp = String.fromCharCode(dv.getInt16(i));
						if(tmp.charCodeAt(0) !== 0){
							tempSenderId = tempSenderId + tmp;
						}
					}

					this.senderId = tempSenderId;

					// +34
					progress.totalSize = dv.getFloat64(46);

					progress.fileName = "";
					i = 58;
					for(; i<314; i = i+2){
						tmp = String.fromCharCode(dv.getInt16(i));
						if(tmp.charCodeAt(0) !== 0){
							progress.fileName = progress.fileName + tmp;
						}
					}

					progress.mimeType = "";
					i = 314;
					for(; i<570; i = i+2){
						tmp = String.fromCharCode(dv.getInt16(i));
						if(tmp.charCodeAt(0) !== 0){
							progress.mimeType = progress.mimeType + tmp;
						}
					}

					progress.id = id;
					progress.fragCount = dv.getInt32(570);
					progress.fragIndex = dv.getInt32(574);
					progress.fragSize = dv.getInt32(578);

					body = data.slice(582);
				}

				FileReceiveDatas[id] = [];
				FileReceiveDatas[id].totalSize = progress.totalSize;
				FileReceiveDatas[id].fileName = progress.fileName;
				FileReceiveDatas[id].mimeType = progress.mimeType;
				FileReceiveDatas[id].fragCount = progress.fragCount;
				FileReceiveDatas[id].push(body);

				this.fileReceiveStartTime = new Date().getTime();
			}
			else{
				progress.id = id;
				progress.type = "binary";
				progress.fileName = FileReceiveDatas[id].fileName;
				progress.mimeType = FileReceiveDatas[id].mimeType;
				progress.totalSize = FileReceiveDatas[id].totalSize;
				progress.fragCount = FileReceiveDatas[id].fragCount;
				progress.fragIndex = dv.getInt32(12);
				progress.fragSize = dv.getInt32(16);

				body = data.slice(20);
				FileReceiveDatas[id].push(body);
			}

			if(versionCheck !==-1) {
				if(this.senderId !== null){
					progress.peerId = this.senderId;
				}
			}

			this.fire("progress", progress);

			if((progress.fragCount - 1) === progress.fragIndex){
				try{
					var blob = new Blob(FileReceiveDatas[id], {
						type: FileReceiveDatas[id].mimeType
					});

					if(!this.hasEvent("message")){
						//
					}

					var PeerID = '';
					if(versionCheck ===-1) {
						PeerID = this.peer.id;
					} else {
						PeerID = this.senderId;
					}

					this.fire("message", {
						type: "binary",
						id: id,
						peerId: PeerID,
						fileName: FileReceiveDatas[id].fileName,
						mimeType: FileReceiveDatas[id].mimeType,
						totalSize: FileReceiveDatas[id].totalSize,
						blob: blob
					});

					this.fileReceiveStartTime = 0;
				}
				catch(e){
					this.fire("error", {
						type: "binary",
						id: id,
						peerId: this.peer.id,
						fileName: FileReceiveDatas[id].fileName,
						mimeType: FileReceiveDatas[id].mimeType,
						totalSize: FileReceiveDatas[id].totalSize
					});
				}

				FileReceiveDatas[id] = null;
			}
		},
		packetSplit: function(buf, size){
			var arr = [],
				packetSize = size,
				totalSize = buf.byteLength,
				max = Math.ceil(totalSize / packetSize),
				i = 0;

			for (; i <max; i++) {
				arr.push(buf.slice(i * packetSize, (i + 1) * packetSize));
			};

			return arr;
		},
		close: function(){
			this.dataChannel.close();
			this.peer.data = null;
		}
	});

})();

window.RTC = RTC;
});
