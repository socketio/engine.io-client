var env = require('./support/env');

// whitelist globals to avoid warnings
global.__eio = null;
global.WEB_SOCKET_LOGGER = null;
global.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = null;
global.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION = null;
global.WEB_SOCKET_SWF_LOCATION = null;
global.WEB_SOCKET_FORCE_FLASH = null;
global.swfobject = null;
global.WebSocket = null;
global.__flash__arrayToXML = null;
global.__flash__argumentsToXML = null;
global.__flash__objectToXML = null;
global.__flash__escapeXML = null;
global.__flash__toXML = null;
global.__flash__request = null;
global.__flash_temp = null;

require('./engine.io-client');
require('./util');
require('./parser');
require('./socket');
require('./transport');

// browser only tests
if (env.browser) {
  require('./connection');
}
