import { encode } from "./contrib/parseqs.js";
import { SocketOptions } from "./socket.js";

export function createUri(opts: SocketOptions, schema: string, query: Record<string, unknown> = {}) {
  return (
    schema +
    "://" +
    _hostname(opts) +
    _port(opts) +
    opts.path +
    _query(opts, query)
  );
}

function _hostname(opts: SocketOptions) {
  const hostname = opts.hostname;
  return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
}

function _port(opts: SocketOptions) {
  if (
    opts.port &&
    ((opts.secure && Number(opts.port !== 443)) ||
      (!opts.secure && Number(opts.port) !== 80))
  ) {
    return ":" + opts.port;
  } else {
    return "";
  }
}

function _query(opts: SocketOptions, query: Record<string, unknown>) {
  const encodedQuery = encode(query);
  return encodedQuery.length ? "?" + encodedQuery : "";
}