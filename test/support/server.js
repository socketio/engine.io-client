// this is a test server to support tests which make requests

var express = require('express');
var app = express();
var join = require('path').join;
var http = require('http').Server(app);
var net = require("net");
var server = require('engine.io').attach(http);
var debug = require('debug')('engine.io-client:support');
http.listen(process.env.ZUUL_PORT);

// serve `engine.io.js` and `worker.js` for worker tests
app.use('/test/support', express.static(join(__dirname, 'public')));

server.on('connection', function(socket){
  socket.send('hi');
});

var flashPolicyServer = net.createServer(function (stream) {
  stream.setTimeout(0);
  stream.setEncoding("utf8");

  stream.addListener("connect", function () {
  });

  stream.addListener("data", function (data) {
    if ( data.indexOf('<policy-file-request/>') != -1){
      debug('policy server - request received');
      stream.write('<cross-domain-policy><allow-access-from domain="*" to-ports="*" /></cross-domain-policy>');
    }
    stream.end();
  });

  stream.addListener("end", function() {
    stream.end();
  });
});

// TODO This port should be assigned randomly and then passed to browser
flashPolicyServer.listen(3008);