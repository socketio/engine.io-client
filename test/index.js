var env = require('./support/env');

// the jsonp polling stuff sets this global
// in order to avoid leak detection we prefill here
if (global.navigator && navigator.appName === 'Microsoft Internet Explorer') {
  if (navigator.appVersion.indexOf('MSIE 6') >= 0 ||
      navigator.appVersion.indexOf('MSIE 7') >= 0 ||
      navigator.appVersion.indexOf('MSIE 8') >= 0 ||
      navigator.appVersion.indexOf('MSIE 9') >= 0
      ) {
    global.___eio = undefined;
  }

  if (navigator.appVersion.indexOf('MSIE 9') >= 0) {
    global.WEB_SOCKET_LOGGER = undefined;
    global.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = undefined;
    global.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION = undefined;
    global.WEB_SOCKET_SWF_LOCATION = undefined;
  }
}

require('./engine.io-client');
require('./util');
require('./parser');
require('./socket');
require('./transport');

// browser only tests
if (env.browser) {
  require('./connection');
}
