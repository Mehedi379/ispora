// Real MikroTik RouterOS API adapter — node-routeros diye actual router-er sathe kotha bole.
// Mock adapter er shathe same interface, tai UI/route code change lage na.
// Router na thakle egulo meaningful error dey (never crash, never fake success).
import { RouterOSAPI } from "node-routeros";

export class RealAdapter {
  constructor(cfg) {
    this.cfg = cfg || {};
    this.simulated = false;
  }

  async _conn() {
    const conn = new RouterOSAPI({
      host: this.cfg.host,
      user: this.cfg.username,
      password: this.cfg.password,
      port: Number(this.cfg.apiPort) || 8728,
      timeout: Number(this.cfg.timeout) || 10,
    });
    try {
      await conn.connect();
    } catch (e) {
      // Connection vs auth error alada kori (meaningful message)
      const msg = String(e?.message || e);
      const err = new Error(
        /login|password|user|auth/i.test(msg)
          ? "Authentication failed — RouterOS username/password check korun"
          : `Router unreachable — ${msg}`
      );
      err.code = /login|password|user|auth/i.test(msg) ? "EAUTH" : "ECONN";
      throw err;
    }
    return conn;
  }

  async testConnection() {
    const conn = await this._conn();
    try {
      const res = await conn.write("/system/resource/print");
      const version = res?.[0]?.version || "unknown";
      return { ok: true, simulated: false, version, message: "Real router connection successful" };
    } finally {
      conn.close();
    }
  }

  async listPppoe() {
    const conn = await this._conn();
    try {
      const rows = await conn.write("/ppp/secret/print");
      return rows.map((r) => ({
        name: r.name,
        password: r.password || "",
        service: r.service || "",
        profile: r.profile || "",
        callerId: r["caller-id"] || "",
        disabled: r.disabled === "true" || r.disabled === true,
        lastLoggedOut: r["last-logged-out"] || "",
        comment: r.comment || "",
        address: r["remote-address"] || "",
        simulated: false,
      }));
    } finally {
      conn.close();
    }
  }

  async setPppoeEnabled(name, enabled) {
    const conn = await this._conn();
    try {
      const rows = await conn.write("/ppp/secret/print", [`?name=${name}`]);
      if (!rows.length) {
        const e = new Error(`PPPoE user "${name}" router-e nei`);
        e.code = "ENOTFOUND";
        throw e;
      }
      const id = rows[0][".id"];
      await conn.write("/ppp/secret/set", [`=.id=${id}`, `=disabled=${enabled ? "no" : "yes"}`]);
      // Active session kill kore dei jate disable sathe sathe effect hoy
      if (!enabled) {
        try {
          const active = await conn.write("/ppp/active/print", [`?name=${name}`]);
          for (const a of active) await conn.write("/ppp/active/remove", [`=.id=${a[".id"]}`]);
        } catch { /* active remove optional */ }
      }
      return { ok: true, simulated: false, name, disabled: !enabled };
    } finally {
      conn.close();
    }
  }

  async createBackup(name) {
    const conn = await this._conn();
    try {
      const fname = (name || `ispora-${Date.now()}`).replace(/[^\w.-]/g, "");
      await conn.write("/system/backup/save", [`=name=${fname}`]);
      // File list theke size nei
      const files = await conn.write("/file/print", [`?name=${fname}.backup`]);
      const size = Number(files?.[0]?.size) || 0;
      // Content fetch RouterOS API te direct hoy na (FTP/sftp lage) — metadata rakhi
      return { name: fname, size, content: null, simulated: false, routerFile: `${fname}.backup` };
    } finally {
      conn.close();
    }
  }
}
