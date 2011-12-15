(function () { function require(p){ var path = require.resolve(p) , mod = require.modules[path]; if (!mod) throw new Error('failed to require "' + p + '"'); if (!mod.exports) { mod.exports = {}; mod.call(mod.exports, mod, mod.exports, require.relative(path)); } return mod.exports;}require.modules = {};require.resolve = function(path){ var orig = path , reg = path + '.js' , index = path + '/index.js'; return require.modules[reg] && reg || require.modules[index] && index || orig;};require.register = function(path, fn){ require.modules[path] = fn;};require.relative = function(parent) { return function(p){ if ('.' != p.charAt(0)) return require(p); var path = parent.split('/') , segs = p.split('/'); path.pop(); for (var i = 0; i < segs.length; i++) { var seg = segs[i]; if ('..' == seg) path.pop(); else if ('.' != seg) path.push(seg); } return require(path.join('/')); };};require.register("event-emitter.js", function(module, exports, require){

/**
 * Module exports.
 */

module.exports = EventEmitter;

/**
 * Event emitter constructor.
 *
 * @api public.
 */

function EventEmitter () {};

/**
 * Adds a listener
 *
 * @api public
 */

EventEmitter.prototype.on = function (name, fn) {
  if (!this.$events) {
    this.$events = {};
  }

  if (!this.$events[name]) {
    this.$events[name] = fn;
  } else if (io.util.isArray(this.$events[name])) {
    this.$events[name].push(fn);
  } else {
    this.$events[name] = [this.$events[name], fn];
  }

  return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

/**
 * Adds a volatile listener.
 *
 * @api public
 */

EventEmitter.prototype.once = function (name, fn) {
  var self = this;

  function on () {
    self.removeListener(name, on);
    fn.apply(this, arguments);
  };

  on.listener = fn;
  this.on(name, on);

  return this;
};

/**
 * Removes a listener.
 *
 * @api public
 */

EventEmitter.prototype.removeListener = function (name, fn) {
  if (this.$events && this.$events[name]) {
    var list = this.$events[name];

    if (io.util.isArray(list)) {
      var pos = -1;

      for (var i = 0, l = list.length; i < l; i++) {
        if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
          pos = i;
          break;
        }
      }

      if (pos < 0) {
        return this;
      }

      list.splice(pos, 1);

      if (!list.length) {
        delete this.$events[name];
      }
    } else if (list === fn || (list.listener && list.listener === fn)) {
      delete this.$events[name];
    }
  }

  return this;
};

/**
 * Removes all listeners for an event.
 *
 * @api public
 */

EventEmitter.prototype.removeAllListeners = function (name) {
  if (name === undefined) {
    this.$events = {};
    return this;
  }

  if (this.$events && this.$events[name]) {
    this.$events[name] = null;
  }

  return this;
};

/**
 * Gets all listeners for a certain event.
 *
 * @api publci
 */

EventEmitter.prototype.listeners = function (name) {
  if (!this.$events) {
    this.$events = {};
  }

  if (!this.$events[name]) {
    this.$events[name] = [];
  }

  if (!io.util.isArray(this.$events[name])) {
    this.$events[name] = [this.$events[name]];
  }

  return this.$events[name];
};

/**
 * Emits an event.
 *
 * @api public
 */

EventEmitter.prototype.emit = function (name) {
  if (!this.$events) {
    return false;
  }

  var handler = this.$events[name];

  if (!handler) {
    return false;
  }

  var args = Array.prototype.slice.call(arguments, 1);

  if ('function' == typeof handler) {
    handler.apply(this, args);
  } else if (io.util.isArray(handler)) {
    var listeners = handler.slice();

    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
  } else {
    return false;
  }

  return true;
};

/**
 * Compatibility with WebSocket
 */

EventEmitter.prototype.addEventListener = EventEmitter.prototype.on;
EventEmitter.prototype.removeEventListener = EventEmitter.prototype.removeListener;
EventEmitter.prototype.dispatchEvent = EventEmitter.prototype.emit;

});require.register("transport.js", function(module, exports, require){

/**
 * Module dependencies.
 */

var util = require('./util')
  , EventEmitter = require('./event-emitter')

/**
 * Module exports.
 */

module.exports = Transport;

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport (opts) {
  this.options = opts;
  this.readyState = '';
};

/**
 * Inherits from EventEmitter.
 */

util.inherits(Transport, EventEmitter);

/**
 * Whether to buffer outgoing data.
 *
 * @api public
 */

Transport.prototype.buffer = true;

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.error = function (code) {
  var err = new Error('transport error');
  err.code = code;
  this.emit('error', code);
  return this;
};

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function () {
  if ('closed' == this.readyState || '' == this.readyState) {
    this.readyState = 'opening';
    this.doOpen();
  }

  return this;
};

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.doClose();
    this.onClose();
  }

  return this;
};

/**
 * Sends a message.
 *
 * @param {String} data
 * @api public
 */

Transport.prototype.send = function (data) {
  if (this.readyState != 'open') {
    this.error('not open');
  } else {
    if (this.buffer) {
      if (!this.writeBuffer) {
        this.writeBuffer = [];
      }

      this.writeBuffer.push(data);
      return this;
    }

    var self = this;
    this.buffer = true;
    this.write(data, function () {
      self.flush();
    });
  }

  return this;
};

/**
 * Flushes the buffer.
 *
 * @api private
 */

Transport.prototype.flush = function () {
  this.buffer = false;
  this.emit('flush');

  if (this.writeBuffer.length) {
    this.writeMany(self.writeBuffer);
    this.writeBuffer = [];
  }

  return this;
};

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function () {
  this.readyState = 'open';
  this.emit('open');
};

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function (data) {
  this.onMessage(parser.decodePacket(data));
};

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
};

});require.register("util.js", function(module, exports, require){

/**
 * engine.io-client
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Inheritance.
 *
 * @param {Function} ctor a
 * @param {Function} ctor b
 * @api public
 */

exports.inherits = function inherits (a, b) {
  function c () { }
  c.prototype = b.prototype;
  a.prototype = new c;
}

/**
 * UA / engines detection namespace.
 *
 * @namespace
 */

util.ua = {};

/**
 * Whether the UA supports CORS for XHR.
 *
 * @api public
 */

util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function () {
  try {
    var a = new XMLHttpRequest();
  } catch (e) {
    return false;
  }

  return a.withCredentials != undefined;
})();

/**
 * Detect webkit.
 *
 * @api public
 */

util.ua.webkit = 'undefined' != typeof navigator &&
  /webkit/i.test(navigator.userAgent);

/**
 * Detect gecko.
 *
 * @api public
 */

util.ua.gecko = 'undefined' != typeof navigator && 
  /gecko/i.test(navigator.userAgent);

/**
 * XHR request helper.
 *
 * @param {Boolean} whether we need xdomain
 * @api private
 */

util.request = function request (xdomain) {
  // if node
  var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
  return new XMLHttpRequest();
  // end

  if (xdomain && 'undefined' != typeof XDomainRequest) {
    return new XDomainRequest();
  }

  // XMLHttpRequest can be disabled on IE
  try {
    if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) { }

  if (!xdomain) {
    try {
      return new ActiveXObject('Microsoft.XMLHTTP');
    } catch(e) { }
  }
};

/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api public
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host'
  , 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

exports.parseUri = function (str) {
  var m = re.exec(str || '')
    , uri = {}
    , i = 14;

  while (i--) {
    uri[parts[i]] = m[i] || '';
  }

  return uri;
};

});require.register("socket.js", function(module, exports, require){

/**
 * Module exports.
 */

module.exports = exports = Socket;

/**
 * Export Transport.
 */

exports.Transport = require('./transport');

/**
 * Export transports
 */

var transports = exports.transports = require('./transports');

/**
 * Export utils.
 */

var util = exports.util = require('./util')

/**
 * Socket constructor.
 *
 * @param {Object} options
 * @api public
 */

function Socket (opts) {
  if ('string' == typeof opts) {
    var uri = util.parseUri(opts);
    opts.host = uri.host;
    opts.secure = uri.scheme == 'wss'
    opts.port = uri.port || (opts.secure ? 443 : 80);
  }

  opts = opts || {};

  this.host = opts.host || opts.hostname || 'localhost';
  this.port = opts.port || 80;
  this.upgrade = false !== opts.upgrade;
  this.path = opts.path || '/engine.io'
  this.forceJSONP = !!opts.forceJSONP;
  this.transports = opts.transports || ['polling', 'websocket', 'flashsocket'];
  this.readyState = '';

  this.open();
};

/**
 * Creates transport of the given type.
 *
 * @api {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
  var transport = new transports[name]({
      host: self.host
    , port: self.port
    , secure: self.secure
    , path: self.path + '/' + name
    , query: self.query ? '&' + self.query : ''
    , forceJSONP: self.forceJSONP
  }, engine);

  return transport;
};

/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */

Socket.prototype.open = function () {
  var self = this;

  this.readyState = 'opening';

  // use the first transport always for the first try
  var transport = this.createTransport(this.transports[0]);
  transport.open();
  transport.once('open', function () {
    this.setTransport(transport);
  });

  // if the engine is closed before transport opened, abort it
  this.once('close', function () {
    transport.close();
  });

  // whether we should perform a probe
  if (this.upgrade && this.transports.length > 1 && transport.pause) {
    var probeTransports = this.transports.slice(1);

    for (var i = 0, l = probeTransports.length; i < l; i++) {
      this.probe(probeTransports[i]);
    }
  }
};

/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */

Socket.prototype.setTransport = function (transport) {
  var self = this;

  // set up transport
  this.transport = transport;

  // set up transport listeners
  transport
    .on('message', function (data) {
      self.onMessage(msg);
    })
    .on('close', function () {
      self.onClose();
    })
};

/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */

Socket.prototype.probe = function (name) {
  this.log.debug('probing transport "%s"', name);

  var transport = this.createTransport(name)
    , self = this

  transport.once('open', function () {
    transport.write(parser.encodePacket('probe'));
    transport.once('message', function (message) {
      if ('probe' == message.type) {
        self.upgrading = true;
        self.emit('upgrading', name);

        self.transport.pause(function () {
          self.setTransport(self.transport);
          self.upgrading = false;
          self.emit('upgrade', name);
        });
      } else {
        var err = new Error('probe error');
        err.transport = transport.name;
        self.emit('error', err);
      }
    });
  });

  transport.open();

  // if closed prematurely, abort probe
  this.once('close', function () {
    transport.close();
  });

  // if another probe suceeds, abort this one
  this.once('upgrading', function (to) {
    if (to != name) {
      transport.close();
    }
  });
};

/**
 * Opens the connection
 *
 * @api public
 */

Socket.prototype.open = function () {
  if ('' == this.readyState || 'closed' == this.readyState) {
    this.transport.open()
  }

  return this;
};

/**
 * Called when connection is deemed open.
 *
 * @api public
 */

Socket.prototype.onOpen = function () {
  this.readyState = 'open';
  this.emit('open');
  this.onopen && this.onopen.call(this);
};

/**
 * Handles a message.
 *
 * @api private
 */

Socket.prototype.onMessage = function (msg) {
  switch (msg.type) {
    case 'noop':
      break;

    case 'open':
      this.onOpen();
      break;

    case 'ping':
      this.writePacket('pong');
      break;

    case 'error':
      var err = new Error('server error');
      err.code = msg.data;
      this.emit('error', err);
      break;

    case 'message':
      this.emit('message', msg.data);
      this.onmessage && this.onmessage.call(this, msg.data);
      break;
  }
};

/**
 * Flush write buffers.
 *
 * @api private
 */

Socket.prototype.flush = function () {
  if (this.writeBuffer.length) {
    // make sure to transfer the buffer to the transport
    this.transport.buffer = true;

    for (var i = 0, l = this.writeBuffer.length; i < l; i++) {
      this.transport.send(this.writeBuffer[i]);
    }

    // force transport flush
    this.transport.flush();
  }
};

/**
 * Sends a message.
 *
 * @param {String} message.
 * @return {Socket} for chaining.
 * @api public
 */

Socket.prototype.send = function (msg) {
  this.writePacket('message', msg);
  return this;
};

/**
 * Encodes a packet and writes it out.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @api private
 */

Socket.prototype.writePacket = function (type, data) {
  this.write(parser.encodePacket(type, data));
};

/**
 * Writes data.
 *
 * @api private
 */

Socket.prototype.write = function (data) {
  if ('open' != this.readyState || this.upgrading) {
    this.writeBuffer.push(data);
  } else {
    this.transport.send(data);
  }
};

/**
 * Closes the connection.
 *
 * @api private
 */

Socket.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    if (this.transport) {
      this.transport.close();
    }

    this.onClose();
  }

  return this;
};

/**
 * Called upon transport close.
 *
 * @api private
 */

Socket.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
  this.onclose && this.onclose.call(this);
};

});require.register("transports/polling-jsonp.js", function(module, exports, require){

/**
 * Module requirements.
 */

var Transport = require('../transport')
  , Polling = require('./polling')
  , util = require('../util')

/**
 * Noop.
 */

function empty () { }

/**
 * Module exports.
 */

module.exports = JSONPPolling;

/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function JSONPPolling (opts) {
  Transport.call(this, opts);
  this.setIndex();
};

/**
 * Inherits from Polling.
 */

util.inherits(JSONPPolling, Polling);

/**
 * Transport name.
 *
 * @api public
 */

JSONPPolling.prototype.name = 'polling-jsonp';

/**
 * Sets JSONP global callback.
 *
 * @api private
 */

JSONPPolling.prototype.setIndex = function () {
  // if we have an index already, set it to empy
  if (undefined != this.index) {
    io.j[this.index] = empty;
  }

  var self = this;
  this.index = io.j.length;
  io.j.push(function (msg) {
    self.onData(msg);
  });
};

/**
 * Opens the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doOpen = function () {
  var self = this;
  util.defer(function () {
    Polling.prototype.doOpen.call(self);
  });
};

/**
 * Closes the socket
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
  this.setIndex();

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
  }
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

JSONPPolling.prototype.doPoll = function () {
  var self = this
    , script = document.createElement('script')
    , query = io.util.query(
           this.socket.options.query
        , 't='+ (+new Date) + '&i=' + this.index
      );

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  script.async = true;
  script.src = this.prepareUrl() + query;

  var insertAt = document.getElementsByTagName('script')[0]
  insertAt.parentNode.insertBefore(script, insertAt);
  this.script = script;

  if (util.ua.gecko) {
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);
    }, 100);
  }
};

});require.register("transports/polling-xhr.js", function(module, exports, require){

/**
 * Module requirements.
 */

var Transport = require('../transport')
  , Polling = require('./polling')
  , EventEmitter = require('../event-emitter')
  , util = require('../util')
  , global = this

/**
 * Module exports.
 */

module.exports = XHRPolling;
module.exports.Request = Request;

/**
 * Empty function
 */

function empty () { }

/**
 * XHR Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function XHRPolling (opts) {
  Transport.call(this, opts);

  if (global.location) {
    this.xd = opts.host != global.location.hostname
      || global.location.port != opts.port;
  }
};

/**
 * Inherits from Polling.
 */

util.inherits(XHRPolling, Polling);

/**
 * Transport name.
 *
 * @api public
 */

XHRPolling.prototype.name = 'polling-xhr';

/**
 * Opens the socket
 *
 * @api private
 */

XHRPolling.prototype.doOpen = function () {
  var self = this;
  util.defer(function () {
    Polling.prototype.open.call(self);
  });
};

/**
 * Closes the socket.
 *
 * @api private
 */

XHRPolling.prototype.doClose = function () {
  if (this.pollXhr) {
    this.pollXhr.abort();
  }

  if (this.sendXhr) {
    this.sendXhr.abort();
  }
};

/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function (opts) {
  opts.uri = this.uri();
  opts.xd = this.xd;
  var req = new Request(opts);
  req.on('error', function () {
    self.error('connection error');
  });
  return req;
};

/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */

XHR.prototype.write = function (data, fn) {
  var req = this.request({ method: 'POST', data: data })
    , self = this

  req.on('success', fn);
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

XHRPolling.prototype.doPoll = function () {
  this.pollXhr = this.request();
};

/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */

function Request (opts) {
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.async = false !== opts.async;
  this.data = undefined != opts.data ? opts.data : null;
  this.create();
}

/**
 * Inherits from Polling.
 */

util.inherits(Request, EventEmitter);

/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function () {
  var xhr = this.xhr = util.request(this.xd);
  this.xhr.open(this.method, this.uri, this.async);

  if ('POST' == this.method) {
    try {
      if (xhr.setRequestHeader) {
        // xmlhttprequest
        xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
      } else {
        // xdomainrequest
        xhr.contentType = 'text/plain';
      }
    } catch (e) {}
  }

  if (this.xd && this.xhr instanceof XDomainRequest) {
    this.xhr.onerror = function () {
      self.onError();
    };
    this.xhr.onload = function () {
      self.onData(xhr.responseText);
    };
    this.xhr.onprogress = empty;
  } else {
    this.xhr.onreadystatechange = function () {
      try {
        if (xhr.readyState != 4) return;

        if (200 == xhr.status) {
          self.onData(xhr.responseText);
        } else {
          self.onError();
        }
      } catch (e) {
        self.onError();
      }
    };
  }

  this.xhr.send(this.data);

  if (global.ActiveXObject) {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};

/**
 * Called upon successful response.
 *
 * @api private
 */

Request.prototype.onSuccess = function () {
  this.emit('success');
  this.cleanup();
}

/**
 * Called if we have data.
 *
 * @api private
 */

Request.prototype.onData = function (data) {
  this.emit('data', data);
  this.onSuccess();
}

/**
 * Called upon error.
 *
 * @api private
 */

Request.prototype.onError = function () {
  this.emit('error');
  this.cleanup();
}

/**
 * Cleans up house.
 *
 * @api private
 */

Request.prototype.cleanup = function () {
  // xmlhttprequest
  this.xhr.onreadystatechange = empty;

  // xdomainrequest
  this.xhr.onload = this.xhr.onerror = empty;

  try {
    this.xhr.abort();
  } catch(e) {}

  if (global.ActiveXObject) {
    delete Browser.requests[this.index];
  }

  this.xhr = null;
}

/**
 * Aborts the request.
 *
 * @api public
 */

Request.prototype.abort = function () {
  this.cleanup();
};

if (global.ActiveXObject) {
  Request.requestsCount = 0;
  Request.requests = {};

  global.attachEvent('onunload', function () {
    for (var i in Request.requests) {
      if (Request.requests.hasOwnProperty(i)) {
        Request.requests[i].abort();
      }
    }
  });
}

});require.register("transports/flashsocket.js", function(module, exports, require){

/**
 * Module dependencies.
 */

var WebSocket = require('./websocket')
  , util = require('../util')

/**
 * Module exports.
 */

module.exports = FlashWS;

/**
 * Noop.
 */

function empty () { }

/**
 * FlashWS constructor.
 *
 * @api public
 */

function FlashWS (options) {
  WebSocket.call(this, options);
};

/**
 * Inherits from WebSocket.
 */

util.inherits(FlashWS, WebSocket);

/**
 * Transport name.
 *
 * @api public
 */

FlashWS.prototype.name = 'flashsocket';

/**
 * Opens the transport.
 *
 * @api public
 */

FlashWS.prototype.doOpen = function () {
  if (!check) {
    // let the probe timeout
    return;
  }

  var base = io.enginePath + '/support/web-socket-js/'
    , self = this

  function log (type) {
    return function (msg) {
      return self.log[type](msg);
    }
  };

  // TODO: proxy logging to client logger
  WEB_SOCKET_LOGGER = { log: log('debug'), error: log('error') };
  WEB_SOCKET_SWF_LOCATION = base + '/WebSocketMainInsecure.swf';
  WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = true;

  load(base + 'swfobject.js', base + 'web_socket.js', function () {
    FlashWs.prototype.doOpen.call(self);
  });
};

/**
 * Feature detection for FlashSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

function check () {
  // if node
  return false;
  // end

  for (var i = 0, l = navigator.plugins.length; i < l; i++) {
    if (navigator.plugins[i].indexOf('Shockwave Flash')) {
      return true;
    }
  }

  return false;
};

/**
 * Lazy loading of scripts.
 * Based on $script by Dustin Diaz - MIT
 */

var scripts = {};

/**
 * Injects a script. Keeps tracked of injected ones.
 *
 * @param {String} path
 * @param {Function} callback
 * @api private
 */

function create (path, fn) {
  if (scripts[path]) return fn();

  var el = doc.createElement('script')
    , loaded = false

  el.onload = el.onreadystatechange = function () {
    var rs = el.readyState;

    if ((!rs || rs == 'loaded' || rs == 'complete') && !loaded) {
      el.onload = el.onreadystatechange = null;
      loaded = 1;
      // prevent double execution across multiple instances
      scripts[path] = true;
      fn();
    }
  };

  el.async = 1;
  el.src = path;

  head.insertBefore(el, head.firstChild);
};

/**
 * Loads scripts and fires a callback.
 *
 * @param {String} path (can be multiple parameters)
 * @param {Function} callback
 */

function load () {
  var total = arguments.length - 1
    , fn = arguments[total]

  for (var i = 0, l = total; i < l; i++) {
    create(arguments[i], function () {
      --total || fn();
    });
  }
};

});require.register("transports/websocket.js", function(module, exports, require){

/**
 * Module dependencies.
 */

var Transport = require('../transport')
  , util = require('../util')
  , global = this

/**
 * Module exports.
 */

module.exports = WS;

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS (opts) {
  Transport.call(this, opts);
};

/**
 * Inherits from Transport.
 */

util.inherits(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function () {
  if (!check()) {
    // let probe timeout
    return;
  }

  this.socket = new ws()(this.uri);
  this.socket.onopen = function () {
    self.onOpen();
  };
  this.socket.onclose = function () {
    self.onClose();
  };
  this.socket.ondata = function (ev) {
    self.onData(ev.data);
  };
};

/**
 * Writes data to socket.
 *
 * @param {String} data.
 * @param {Function} flush callback.
 * @api private
 */

WS.prototype.write = function (data, fn) {
  this.socket.send(data);
  fn();
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @api private
 */

Polling.prototype.writeMany = function (packets) {
  for (var i = 0, l = packets.length; i < l; i++) {
    this.write(packets[0]);
  }
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function () {
  this.socket.close();
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

WS.prototype.uri = function () {
  return [
      this.options.secure ? 'wss' : 'ws'
    , this.options.host
    , ':'
    , this.options.port
    , this.options.path
    , this.options.query
  ].join('')
};

/**
 * Getter for WS constructor.
 *
 * @api private
 */

function ws () {
  // if node
  return require('easy-websocket');
  // end

  return global.WebSocket || global.MozWebSocket;
}

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

function check () {
  return !!ws();
}

});require.register("transports/index.js", function(module, exports, require){

/**
 * Export transports.
 */

exports.polling = require('./polling');
exports.websocket = require('./websocket');
exports.flashsocket = require('./flashsocket');

});require.register("transports/polling.js", function(module, exports, require){

/**
 * Module dependencies.
 */

var Transport = require('../transport')
  , XHR = require('./polling-xhr')
  , JSON = require('./polling-json')
  , util = require('../util')
  , parser = require('../parser')
  , global = this

/**
 * Module exports.
 */

module.exports = Polling;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api public
 */

function Polling (opts) {
  var xd;

  if (global.location) {
    xd = opts.host != global.location.hostname
      || global.location.port != opts.port;
  }

  var xhr = request(xd);

  if (xhr && !opts.forceJSONP) {
    return new XHR;
  } else {
    return new JSONP;
  }
};

/**
 * Inherits from Transport.
 */

util.inherits(Polling, Transport);

/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function () {
  this.poll();
  this.write(parser.encodePacket('ping'));
};

/**
 * Pauses polling.
 *
 * @param {Function} callback upon flush
 * @api private
 */

Polling.prototype.pause = function (onFlush) {
  this.paused = true;

  var pending = 0;

  if (this.polling) {
    pending++;
    this.once('data', function () {
      --pending || onFlush();
    }
  }

  if (this.buffer) {
    pending++;
    this.once('flush', function () {
      --pending || onFlush();
    });
  }
};

/**
 * Starts polling cycle.
 *
 * @api public
 */

Polling.prototype.poll = function () {
  if (!this.paused) {
    this.polling = true;
    this.doPoll();
    this.emit('poll');
  }
};

/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */

Polling.prototype.onData = function (data) {
  var packets = parser.decodePayload(data);

  for (var i = 0, l = packets.length; i < l; i++) {
    // for polling, we actually need to peak at the messages
    var decoded = parser.decodePacket(packets[i]);

    // if its a PONG to our initial ping we consider the connection open
    if ('opening' == this.readyState) {
      if ('pong' == decoded.type) {
        this.onOpen();
        continue;
      } else {
        this.error('protocol violation');
        return;
      }
    }

    // if its a close packet, we close the ongoing requests
    if ('close' == decoded.type) {
      this.doClose();
      this.onClose();
    }

    // otherwise bypass onData and handle the message
    this.onMessage(decoded);
  }

  // if we got data we're not polling
  this.polling = false;

  // trigger next poll
  this.poll();
};

/**
 * For polling, send a close packet.
 *
 * @api private
 */

Polling.prototype.doClose = function () {
  this.write(parser.encodePacket('close'));
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @api private
 */

Polling.prototype.writeMany = function (packets) {
  this.write(parser.encodePayload(packets));
};

});require.register("parser.js", function(module, exports, require){

/**
 * Packet types.
 */

var packets = exports.packets = {
    'open': 1
  , 'close': 2
  , 'ping': 3
  , 'pong': 4
  , 'message': 5
  , 'error': 6
  , 'noop': 7
};

var packetslist = Object.keys(packets);

/**
 * Encodes a packet.
 *
 * @api private
 */

exports.encodePacket = function (type, data) {
  var encoded = packets[type]

  // data fragment is optional
  if ('string' == typeof data) {
    encoded += ':' + data;
  }

  return encoded;
};

/**
 * Decodes a packet.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

exports.decodePacket = function (data) {
  if (~data.indexOf(':')) {
    var pieces = data.split(':');
    return { type: packetslist[pieces[0]], data: pieces[1] };
  } else {
    return { type: packetslist[data] };
  }
};

/**
 * Encodes multiple messages (payload).
 *
 * @param {Array} messages
 * @api private
 */

exports.encodePayload = function (packets) {
  var encoded = '';

  if (packets.length == 1) {
    return packets[0];
  }

  for (var i = 0, l = packets.length; i < l; i++) {
    encoded += '\ufffd' + packets[i].length + '\ufffd' + packets[i]
  }

  return encoded;
};

/*
 * Decodes data when a payload is maybe expected.
 *
 * @param {String} data
 * @return {Array} messages
 * @api public
 */

exports.decodePayload = function (data) {
  if (undefined == data || null == data) {
    return [];
  }

  if (data[0] == '\ufffd') {
    var ret = [];

    for (var i = 1, length = ''; i < data.length; i++) {
      if (data[i] == '\ufffd') {
        ret.push(data.substr(i + 1).substr(0, length));
        i += Number(length) + 1;
        length = '';
      } else {
        length += data[i];
      }
    }

    return ret;
  } else {
    return [data];
  }
}

});require.register("engine-client.js", function(module, exports, require){

/**
 * Client version.
 *
 * @api public.
 */

exports.version = '0.1.0';

/**
 * Protocol version.
 *
 * @api public.
 */

exports.protocol = 1;

/**
 * Socket constructor.
 *
 * @api public.
 */

exports.Socket = require('./socket');

});eio = require('engine.io-client');
})();