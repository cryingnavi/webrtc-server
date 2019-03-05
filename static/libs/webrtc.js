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
			this.listeners = void 0;
			return this;
		}

		if (listeners = this.listeners[name]) {
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
				catch(e) {
					reject(e);
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
			this.fire("open", e);
		}, this);
		this.socket.onclose = utils.bind(function(e){
			this.fire("close", e);
		}, this);
		this.socket.onerror = utils.bind(function(e){
			this.fire("error", e);
		}, this);
		this.socket.onmessage = utils.bind(function(e){
			this.fire("message", e);
		}, this);
	},
	send: function(data){
		try{
			this.socket.send(data);
		}
		catch(err){ }
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
				token: this.rtc.getOfferTokenId()
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
				candidate: candidate
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

			case "ON_CALL":
				this.fire("onCall", body.answer);
				break;
			case "ON_OFFER_SDP":
				this.fire("onOfferSdp", body.sdp);
				break;
			case "ON_ANSWER_SDP":
				this.fire("onAnswerSdp", body.sdp);
				break;
			case "ON_OFFER_CANDIDATE":
				this.fire("onOfferCandidate", body.sdp);
				break;
			case "ON_ANSWER_CANDIDATE":
				this.fire("onAnswerCandidate", body.sdp);
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
			localMediaTarget: null,
			remoteMediaTarget: null,
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
				video: "H264"
			},
			onlyTurn: false
		};
		utils.apply(this.config, config);

		if (!this.config.localMediaTarget) {
			alert('Error!!');
			return;
		}

    if(!this.config.userMedia.audio && !this.config.userMedia.video && !this.config.dataChannelEnabled){
			alert('Error!!');
			return;
		}

		this.localMediaTarget = document.getElementById(this.config.localMediaTarget);
		this.remoteMediaTarget = document.getElementById(this.config.remoteMediaTarget);

		this.url = this.config.url;
		this.ws = this.config.ws;
		this.media = null;
    this.calling = null;
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
		this.calling.on("onCall", this.onCall, this);
		this.calling.on("onOfferSdp", this.onOfferSdp, this);
		this.calling.on("onAnswerSdp", this.onAnswerSdp, this);
		this.calling.on("onOfferCandidate", this.onOfferCandidate, this);
		this.calling.on("onAnswerCandidate", this.onAnswerCandidate, this);
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
			this.media = new Media(stream);
			this.localMediaTarget.srcObject = stream;
      this.fire("createLocal", stream);
    }, this)).catch(utils.bind(function(e){
      this.fire("createLocal", {
				type: "createLocal",
				data: e
			});
    }, this));
  },
	ready: function () {
		var xhr = request({
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

	},
	createPeer: function (type) {
		var localStream = this.media.getStream();

		var peerConfig = {
			iceServers: this.config.iceServers,
			dataChannelEnabled: this.config.dataChannelEnabled,
			bandwidth: this.config.bandwidth,
			preferCodec: this.config.preferCodec
		};

		var token = '';
		if (type === 'offer') {
			token = this.getOfferTokenId();
		} else {
			token = this.getAnswerTokenId();
		}

		var peer = new Peer(this, token, localStream, peerConfig);
		peer.on("sendOfferSdp", this.sendOfferSdp, this);
		peer.on("sendAnswerSdp", this.sendAnswerSdp, this);
		peer.on("addRemoteStream", this.addRemoteStream, this);
		peer.on("signalEnd", this.signalEnd, this);
		peer.on("error", function(code, desc, data){
			this.fire("error", code, desc, data);
		}, this);
		peer.on("stateChange", this._stateChange, this);

		if (type === 'offer') {
			peer.on("sendCandidate", this.sendOfferCandidate, this);
		} else {
			peer.on("sendCandidate", this.sendAnswerCandidate, this);
		}
		return peer;
	},
	onConnect: function (offerToken) {
		this.offerToken = offerToken;
	},
	onCall: function (answerToken) {
		this.offer = this.createPeer();
		this.offer.createOffer();
		this.answerToken = answerToken;
	},
	onOfferSdp: function (sdp) {
		this.answer = this.createPeer();
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
	sendCandidate: function (candidate) {
		this.calling.sendCandidate(candidate);
	}
});


var Peer = utils.Extend(utils.Event, {
	initialize: function(obj, token, localStream, config){
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
		this.media = null;
		this.connected = false;
		this.oldStats = null;
		this.statsReportTimer = null;

		this.fractionLost = {
			audio: [
				{rating: 1, fromAflost: 0, toAflost: 50},
				{rating: 2, fromAflost: 51, toAflost: 150},
				{rating: 3, fromAflost: 151, toAflost: 250},
				{rating: 4, fromAflost: 251, toAflost: 350},
				{rating: 5, fromAflost: 351, toAflost: 9999999}
			],
			video: [
				{rating: 1, fromAflost: 0, toAflost: 40},
				{rating: 2, fromAflost: 41, toAflost: 55},
				{rating: 3, fromAflost: 56, toAflost: 70},
				{rating: 4, fromAflost: 71, toAflost: 90},
				{rating: 5, fromAflost: 91, toAflost: 9999999}
			]
		};
	},
	setEvent: function(){
		var pc = this.pc;
		pc.onicecandidate = utils.bind(function(e){
			if(e.candidate){
				if(this.config.onlyTurn){
					if(e.candidate.candidate.indexOf("relay") < 0){
						return;
					}
				}

				this.fire("sendCandidate", this.id, e.candidate);
			}
		}, this);
/*
		pc.onaddstream = utils.bind(function(e){
			this.media = new Media(e.stream);
			this.fire("addRemoteStream", this.id, this.uid, e.stream);
		}, this);
*/
		pc.track = utils.bind(function(e){
			this.media = new Media(e.stream);
			this.fire("addRemoteStream", this.id, this.uid, e.stream);
		}, this);

		pc.onsignalingstatechange = utils.bind(function(e){
			this.fire("signalingstatechange", e);
		}, this);

		pc.oniceconnectionstatechange = utils.bind(function(e){
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
			this.pc.addStream(this.localStream);
		}

		if(utils.dataChannelSupport && this.config.dataChannelEnabled){
			this.data = new Data(this);
			this.data.on("open", utils.bind(function(){
				//this.call.playRtc.fire("addDataStream", this.id, this.uid, this.data);
			}, this));
		}
		else{
			//에러
		}
	},
	replaceBandWidth: function(sdp){
		if(!this.config.bandwidth){
			return sdp;
		}

		var bundles = sdp.match(/a=group:BUNDLE (.*)?\r\n/);
		if(bundles){
			if(bundles[1]){
				bundles = bundles[1].split(" ");
			}
			else{
				return sdp;
			}
		}
		else{
			return sdp;
		}

		var ab = this.config.bandwidth.audio,
			vb = this.config.bandwidth.video,
			db = this.config.bandwidth.data,
			vReg = new RegExp("a=rtpmap:(\\d+) " + this.config.preferCodec.video + "/(\\d+)");
		sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, "");

		for(var i=0; i<bundles.length; i++){
			if(bundles[i] === "audio" || bundles[i] === "sdparta_0"){
				if(this.config.preferCodec.audio === "opus"){
					sdp = sdp.replace("a=mid:"+bundles[i]+"\r\n", "a=mid:"+bundles[i]+"\r\nb=AS:" + (ab > 0 ? ab : 32) + "\r\n");
				}
			}else if(bundles[i] === "video" || bundles[i] === "sdparta_1"){
				sdp = sdp.replace("a=mid:"+bundles[i]+"\r\n", "a=mid:"+bundles[i]+"\r\nb=AS:" + (vb > 0 ? vb : 1500) + "\r\n");
				if (utils.browser.name === "chrome"){
					sdp = sdp.replace(vReg, "a=rtpmap:$1 " + this.config.preferCodec.video + "/$2\r\na=fmtp:$1 x-google-start-bitrate=600; x-google-min-bitrate=600; x-google-max-bitrate=" + (vb > 0 ? vb : 1500) + "; x-google-max-quantization=56");
				}
			}else if(bundles[i] === "data" || bundles[i] === "sdparta_2"){
				sdp = sdp.replace("a=mid:"+bundles[i]+"\r\n", "a=mid:"+bundles[i]+"\r\nb=AS:" + (db > 0 ? db : 1638400) + "\r\n");
			}
		}

		return sdp;
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
	_getConstraints: function(){
		var constraints;
		if(utils.browser.name === "firefox"){
			constraints = {
				offerToReceiveAudio: this.call.userMedia.audio,
				offerToReceiveVideo: this.call.userMedia.video
			};
		}
		else{
			constraints = {
				optional: [
					{ VoiceActivityDetection: false	},
					{ DtlsSrtpKeyAgreement: true}
				],
				mandatory: {
					OfferToReceiveAudio: this.call.userMedia.audio,
					OfferToReceiveVideo: this.call.userMedia.video
				}
			};
		}
		return constraints;
	},
	createOffer: function(){
		this.createPeerConnection();
		this.pc.createOffer(utils.bind(function(sessionDesc){
			sessionDesc.sdp = this.replaceBandWidth(sessionDesc.sdp);
			sessionDesc.sdp = this.replacePreferCodec(sessionDesc.sdp, /m=audio(:?.*)?/, this.config.preferCodec.audio);
			sessionDesc.sdp = this.replacePreferCodec(sessionDesc.sdp, /m=video(:?.*)?/, this.config.preferCodec.video);

			this.pc.setLocalDescription(sessionDesc);
			this.fire("sendOfferSdp", sessionDesc);
		}, this), utils.bind(function(){
			//에러
		}, this), this._getConstraints());
	},
	createAnswer: function(sdp){
		if(!this.pc){
			this.createPeerConnection();
		}
		var me = this,
			pc = this.pc;

		try{
			pc.setRemoteDescription(new NativeRTCSessionDescription(sdp));
		}
		catch(e){
			//에러
			return;
		}

		pc.createAnswer(utils.bind(function(sessionDesc){
			sessionDesc.sdp = this.replaceBandWidth(sessionDesc.sdp);
			sessionDesc.sdp = this.replacePreferCodec(sessionDesc.sdp, /m=audio(:?.*)?/, this.config.preferCodec.audio);
			sessionDesc.sdp = this.replacePreferCodec(sessionDesc.sdp, /m=video(:?.*)?/, this.config.preferCodec.video);

			this.pc.setLocalDescription(sessionDesc);
			this.fire("sendAnswerSdp", sessionDesc);
		}, this), utils.bind(function(e){
			//에러
		}, this), this._getConstraints());
	},
	receiveAnwserSdp: function(sdp){
		var pc = this.pc;
		try{
			pc.setRemoteDescription(new NativeRTCSessionDescription(sdp));
		}
		catch(e){
			//에러
		}
	},
	receiveCandidate: function(candidate){
		if(!this.pc){
			this.createPeerConnection();
		}

		var pc = this.pc;
		try{
			candidate = new NativeRTCIceCandidate(candidate);
			pc.addIceCandidate(candidate);
		}
		catch(e){
			//에러
		}
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
	getMedia: function(){
		if(this.media){
			return this.media;
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
				Logger.warn("cdm", {
					klass: "Media",
					method: "createRecorder",
					message: "Media Recorder is not suporrted"
				});
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

window.RTC = RTC;
});
