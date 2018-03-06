/* global importScripts,eio,postMessage */

importScripts('/test/support/engine.io.js');

var socket = new eio.Socket();

var count = 0;
socket.on('message', function (msg) {
  if (count < 10) {
    count++
    socket.send('give utf8');
  }
  postMessage(msg);
});
