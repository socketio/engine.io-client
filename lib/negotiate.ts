import debugModule from "debug"; // debug()
import { SocketOptions } from "./socket.js";
import { createUri } from "./createuri.js";

const debug = debugModule("engine.io-client:negotiate"); // debug()

class NegotiateError extends Error {
  public readonly type = "NegotiateError";

  constructor(
    reason: string,
    readonly context: any
  ) {
    super(reason);
  }
}

export interface NegotiateResult {
  url: string;
  token: string;
}

export async function negotiate(opts: Partial<SocketOptions>, query: Record<string, string>) {
  const schema = this.opts.secure ? "https" : "http";
  const uri = createUri(Object.assign({},
    this.opts,
    {
      path: this.opts.negotiatePath,
    }), schema, this.query);


  let negotiateResult = await fetch(uri);

  if (negotiateResult.status < 200 || negotiateResult.status >= 400) {
    throw new NegotiateError("Unexpected status code " + negotiateResult.status, negotiateResult);
  }

  return await negotiateResult.json();
}
