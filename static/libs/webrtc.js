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
		this.listeners || (this.listeners = { });
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
			i = -1

		if (listeners){
			var len = listeners.length;
			var ev = null;
			switch (args.length) {
				case 0:
					if(len === 1){
						return (ev = listeners[0]).callback.call(this);
					}
					else{
						while (++i < len){
							(ev = listeners[i]).callback.call(this);
						}
						return this;
					}
				default:
					if(len === 1){
						return (ev = listeners[0]).callback.apply(this, args);
					}
					else{
						while (++i < len){
							(ev = listeners[i]).callback.apply(this, args);
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
				try{
					res = JSON.parse(res);
					resolve(res)
				}
				catch(e){
					reject(e)
				}
			}
			else if (xhr.readyState === 4 && xhr.status !== 200) {
				reject(e)
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
			//this.fire("error", "C4007", SDK_ERROR_CODE["C4007"]);
		}, this));
		this.socket.on("message", this.onMessage, this);
	},
	send: function(data){
		if(this.socket.getReadyState() === 1){
			this.socket.send(data);
		}
		else{
			//this.fire("error", "C4003", SDK_ERROR_CODE["C4003"]);
		}
	},
	serialize: function(data){
		var default_json = {
			header: {
				command: "",
				userId: ""
			},
			body: { }
		};
		return JSON.stringify(utils.apply(default_json, data));
	},
	connect: function (roomId) {
		var data = this.serialize({
			header: {
				command: "connect",
				userId: this.rtc.getUserId()
			},
			body: {
				roomId: roomId
			}
		});

		this.send(data);
	},
	onMessage:  function (message) {
		var data = JSON.parse(message.data);
	}
});

var RTC = utils.Extend(utils.Event, {
	initialize: function(config){
		RTC.base.initialize.call(this);
		config = config || {}
		this.config = {
			userId: '',
			url: '',
			ws: '',
			iceServers: null,
			localMediaTarget: null,
			remoteMediaTarget: null,
			userMedia: {
				audio: true,
				video: true
			},
			data: true,
			bandwidth: {
				video: 1500,
				data: 1638400
			},
			preferCodec: {
				audio: "opus",
				video: "H264"
			},
			onlyTurn: false
		}
		utils.apply(this.config, config);

		if (!this.config.localMediaTarget) {
			alert('Error!!')
			return;
		}

    if(!this.config.userMedia.audio && !this.config.userMedia.video && !this.config.data){
			alert('Error!!')
			return;
		}

		this.localMediaTarget = document.getElementById(this.config.localMediaTarget)
		this.remoteMediaTarget = document.getElementById(this.config.remoteMediaTarget)

		this.userId = this.config.userId;
		this.url = this.config.url;
		this.ws = this.config.ws;
		this.iceServers = [];
		this.media = null;
    this.calling = null;

		this.userMedia = {
			audio: this.config.userMedia.audio,
			video: this.config.userMedia.video
		};

		this.calling = new Channeling(this, this.ws);
	},
	getUserId: function () {
		return this.userId;
	},
  createLocal: function () {
    navigator.mediaDevices.getUserMedia(this.userMedia).then(utils.bind(function(stream){
			this.localMediaTarget.srcObject = stream;
      this.fire("createLocal", stream);
    }, this)).catch(utils.bind(function(e){
      this.fire("createLocal", {
				type: "createLocal",
				data: e
			});
    }, this));
  },
	ready: function (userId) {
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
		this.calling.connect(roomId);
  },
	hangUp: function () {
		
	}
});

window.RTC = RTC;
});
