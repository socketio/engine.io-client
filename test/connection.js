var expect = require('expect.js');
var eio = require('../');
var debug = require('debug')('engine.io-client-connection');
var hasFlash = require('hasflash');

describe('connection', function() {
  this.timeout(10000);

  // only if browser has flash installed
  if (hasFlash()) {
    it('should be able to send messages using flashsockets', function(done) {
      var socket = new eio.Socket({
        flashPath : 'test/support/',
        transports : ['flashsocket'],
        policyPort : 3008, // TODO this should be passed from support/server.js
        policyAddress : 'localhost', // 127.0.0.1 does not work
        forceFlash : true
      });

      // TODO this test case fails if it's not the first one in this file

      // override web-socket modules's browser WebSocket support checking
      WEB_SOCKET_FORCE_FLASH = true;

      socket.on('open', function() {
        socket.on('message', function(data) {
          expect(data).to.equal('hi');
          socket.close();
          done();
        });
      });
    });
  }

  it('should connect to localhost', function(done) {
    var socket = new eio.Socket();
    socket.on('open', function() {
      socket.on('message', function(data) {
        expect(data).to.equal('hi');
        socket.close();
        done();
      });
    });
  });

  // no `Worker` on old IE
  if (global.Worker) {
    it('should work in a worker', function(done) {
      var worker = new Worker('/test/support/worker.js');
      worker.onmessage = function(e) {
        expect(e.data);
        done();
      };
    });
  }
});
