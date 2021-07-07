module.exports = {
  WebSocket: require("ws"),
  usingBrowserWebSocket: false,
  defaultBinaryType: "nodebuffer",
  nextTick: (cb, _setTimeoutFn) => process.nextTick(cb)
};
