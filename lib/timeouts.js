const self = require("./globalThis");
// Keep a reference to the real timeout functions so they can be used when
// overridden.
const NATIVE_SET_TIMEOUT = setTimeout;
const NATIVE_CLEAR_TIMEOUT = clearTimeout;

module.exports.installTimeoutFunctions = function(obj, opts) {
  if (opts.useNativeTimeouts) {
    obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(self);
    obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(self);
  } else {
    obj.setTimeoutFn = setTimeout.bind(self);
    obj.clearTimeoutFn = clearTimeout.bind(self);
  }
};
