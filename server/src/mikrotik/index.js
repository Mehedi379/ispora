import { MockAdapter } from "./mockAdapter.js";
import { RealAdapter } from "./realAdapter.js";
import { decrypt } from "./crypto.js";

// Server row (DB) theke adapter banai. mode="mock" hole MockAdapter, "real" hole RealAdapter.
// Password ekhane-i decrypt hoy — adapter er baire plain password jay na.
export function getAdapter(server) {
  const cfg = {
    host: server.ip,
    apiPort: server.apiPort,
    username: server.username,
    password: decrypt(server.passwordEnc),
    timeout: server.timeout,
  };
  return server.mode === "real" ? new RealAdapter(cfg) : new MockAdapter(cfg);
}

// Error gula user-friendly message + flag e convert kori (password kokhono na)
export function adapterError(e) {
  const code = e?.code || "";
  const auth = code === "EAUTH" || code === "EAUTH_SIM";
  const conn = code === "ECONN" || code === "ECONNREFUSED_SIM";
  return {
    error: e?.message || "Router operation failed",
    kind: auth ? "auth" : conn ? "connection" : "operation",
  };
}
