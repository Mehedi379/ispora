// Mock/Simulation adapter — physical router chara-i pura workflow test kora jay.
// Shob operation `simulated: true` diye label kora, jate real operation bole bhul na hoy.
// Mock data purapuri alada — production Client/billing table-e kichu lekhe na.

// Deterministic simulated PPPoE secrets (router-e thaka user der moto)
const MOCK_SECRETS = [
  { name: "mockuser1001", profile: "10M", disabled: false, comment: "Rahim (sim)", address: "10.10.0.11" },
  { name: "mockuser1002", profile: "20M", disabled: false, comment: "Karim (sim)", address: "10.10.0.12" },
  { name: "mockuser1003", profile: "20M", disabled: true, comment: "Jamal (sim)", address: "10.10.0.13" },
  { name: "mockuser1004", profile: "40M", disabled: false, comment: "Nasir (sim)", address: "10.10.0.14" },
  { name: "mockuser1005", profile: "10M", disabled: false, comment: "Sumon (sim)", address: "10.10.0.15" },
  { name: "user1001",     profile: "10M", disabled: false, comment: "existing match (sim)", address: "10.10.0.21" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Config-er sentinel value diye failure simulate kora jay (test er jonno):
//   host "unreachable.local" / 10.255.x.x  -> connection fail
//   username "baduser" ba password "wrongpass" -> auth fail
function checkReachable(cfg) {
  const host = String(cfg.host || "");
  if (!host || host === "unreachable.local" || host.startsWith("10.255.")) {
    const e = new Error("Router unreachable — connection timeout (simulated)");
    e.code = "ECONNREFUSED_SIM";
    throw e;
  }
}
function checkAuth(cfg) {
  if (cfg.username === "baduser" || cfg.password === "wrongpass") {
    const e = new Error("Authentication failed — username/password vul (simulated)");
    e.code = "EAUTH_SIM";
    throw e;
  }
}

export class MockAdapter {
  constructor(cfg) {
    this.cfg = cfg || {};
    this.simulated = true;
    // per-instance copy jate enable/disable session-e reflect hoy
    this._secrets = MOCK_SECRETS.map((s) => ({ ...s }));
  }

  async testConnection() {
    await sleep(150);
    checkReachable(this.cfg);
    checkAuth(this.cfg);
    return { ok: true, simulated: true, version: "RouterOS 7.x (MOCK)", message: "Mock connection successful — eta simulation, real router noy" };
  }

  async listPppoe() {
    await sleep(120);
    checkReachable(this.cfg);
    checkAuth(this.cfg);
    return this._secrets.map((s) => ({ ...s, simulated: true }));
  }

  async setPppoeEnabled(name, enabled) {
    await sleep(100);
    checkReachable(this.cfg);
    checkAuth(this.cfg);
    const s = this._secrets.find((x) => x.name === name);
    if (!s) {
      const e = new Error(`PPPoE user "${name}" router-e nei (simulated)`);
      e.code = "ENOTFOUND_SIM";
      throw e;
    }
    s.disabled = !enabled;
    return { ok: true, simulated: true, name, disabled: s.disabled };
  }

  async createBackup(name) {
    await sleep(200);
    checkReachable(this.cfg);
    checkAuth(this.cfg);
    const stamp = new Date().toISOString();
    const content =
      `# ISPora SIMULATED MikroTik backup\n# NOT a real router backup\n# server=${this.cfg.host || "mock"} time=${stamp}\n` +
      this._secrets.map((s) => `/ppp secret add name=${s.name} profile=${s.profile} disabled=${s.disabled}`).join("\n") + "\n";
    return { name: name || `mock-backup-${Date.now()}`, size: content.length, content, simulated: true };
  }
}
