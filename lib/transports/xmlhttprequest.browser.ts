// browser shim for xmlhttprequest module

import { hasCORS } from "../contrib/has-cors.js";
import * as globalThisModule from "../globalThis.js";
const globalThis =
  globalThisModule.default ||
  ((globalThisModule as any) as typeof globalThisModule.default);

export default function(opts) {
  const xdomain = opts.xdomain;

  // XMLHttpRequest can be disabled on IE
  try {
    if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) {}

  if (!xdomain) {
    try {
      return new globalThis[["Active"].concat("Object").join("X")](
        "Microsoft.XMLHTTP"
      );
    } catch (e) {}
  }
}
