import { test } from "node:test";
import assert from "node:assert/strict";
import { MockAdapter } from "../src/mikrotik/mockAdapter.js";
import { encrypt, decrypt } from "../src/mikrotik/crypto.js";

// ---------- Mock adapter: connection ----------
test("mock testConnection succeeds and is clearly simulated", async () => {
  const a = new MockAdapter({ host: "192.168.88.1", username: "admin", password: "pass" });
  const res = await a.testConnection();
  assert.equal(res.ok, true);
  assert.equal(res.simulated, true);
  assert.match(res.version, /MOCK/);
});

test("mock testConnection fails on unreachable host", async () => {
  const a = new MockAdapter({ host: "unreachable.local", username: "admin", password: "pass" });
  await assert.rejects(() => a.testConnection(), (e) => e.code === "ECONNREFUSED_SIM");
});

test("mock testConnection fails on 10.255.x unreachable range", async () => {
  const a = new MockAdapter({ host: "10.255.0.1", username: "admin", password: "pass" });
  await assert.rejects(() => a.testConnection(), (e) => e.code === "ECONNREFUSED_SIM");
});

test("mock testConnection fails on bad auth", async () => {
  const a = new MockAdapter({ host: "192.168.88.1", username: "baduser", password: "pass" });
  await assert.rejects(() => a.testConnection(), (e) => e.code === "EAUTH_SIM");
  const b = new MockAdapter({ host: "192.168.88.1", username: "admin", password: "wrongpass" });
  await assert.rejects(() => b.testConnection(), (e) => e.code === "EAUTH_SIM");
});

// ---------- Mock adapter: PPPoE ----------
test("mock listPppoe returns simulated users", async () => {
  const a = new MockAdapter({ host: "192.168.88.1" });
  const users = await a.listPppoe();
  assert.ok(users.length > 0);
  assert.ok(users.every((u) => u.simulated === true));
  assert.ok(users.find((u) => u.name === "mockuser1001"));
});

test("mock setPppoeEnabled toggles disabled flag", async () => {
  const a = new MockAdapter({ host: "192.168.88.1" });
  const off = await a.setPppoeEnabled("mockuser1001", false);
  assert.equal(off.disabled, true);
  assert.equal(off.simulated, true);
  const on = await a.setPppoeEnabled("mockuser1001", true);
  assert.equal(on.disabled, false);
});

test("mock setPppoeEnabled errors on unknown user", async () => {
  const a = new MockAdapter({ host: "192.168.88.1" });
  await assert.rejects(() => a.setPppoeEnabled("ghost9999", true), (e) => e.code === "ENOTFOUND_SIM");
});

test("mock setPppoeEnabled fails when router unreachable", async () => {
  const a = new MockAdapter({ host: "unreachable.local" });
  await assert.rejects(() => a.setPppoeEnabled("mockuser1001", true), (e) => e.code === "ECONNREFUSED_SIM");
});

// ---------- Mock adapter: backup ----------
test("mock createBackup returns simulated content clearly labeled", async () => {
  const a = new MockAdapter({ host: "192.168.88.1" });
  const b = await a.createBackup("test");
  assert.equal(b.simulated, true);
  assert.ok(b.size > 0);
  assert.match(b.content, /SIMULATED/);
});

// ---------- Duplicate detection (import logic) ----------
test("duplicate detection: existing pppoe filtered out", () => {
  const routerUsers = ["mockuser1001", "mockuser1002", "user1001"];
  const existing = new Set(["user1001"]); // DB-te already ache
  const fresh = routerUsers.filter((n) => !existing.has(n));
  assert.deepEqual(fresh, ["mockuser1001", "mockuser1002"]);
  assert.equal(routerUsers.length - fresh.length, 1); // 1 duplicate
});

test("bulk import: same-file duplicate dedupe", () => {
  const lines = ["u1,A", "u2,B", "u1,C"]; // u1 duplicate in file
  const seen = new Set();
  const fresh = [];
  for (const l of lines) {
    const pppoe = l.split(",")[0];
    if (seen.has(pppoe)) continue;
    seen.add(pppoe); fresh.push(pppoe);
  }
  assert.deepEqual(fresh, ["u1", "u2"]);
});

// ---------- Credential encryption ----------
test("crypto encrypt/decrypt round-trip", () => {
  const enc = encrypt("SuperSecret123");
  assert.ok(enc.startsWith("v1:"));
  assert.notEqual(enc, "SuperSecret123"); // actually encrypted
  assert.equal(decrypt(enc), "SuperSecret123");
});

test("crypto decrypt rejects tampered data", () => {
  const enc = encrypt("hello");
  const parts = enc.split(":");
  parts[3] = parts[3].replace(/.$/, (c) => (c === "a" ? "b" : "a")); // flip last hex char
  assert.equal(decrypt(parts.join(":")), null);
});

test("crypto handles empty/null", () => {
  assert.equal(encrypt(""), null);
  assert.equal(encrypt(null), null);
  assert.equal(decrypt(null), null);
  assert.equal(decrypt("plain-not-v1"), null);
});
