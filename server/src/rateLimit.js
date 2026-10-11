// Simple in-memory fixed-window limiter — login brute-force protection.
// Single-process e kaj kore (dev/small deploy). Multi-instance hole Redis-backed limiter lagbe.
const hits = new Map();

// Bhor khowa key gula periodically porishkar koro — memory leak rokhte
setInterval(() => {
  const now = Date.now();
  for (const [k, e] of hits) if (now > e.reset) hits.delete(k);
}, 60 * 1000).unref();

export function rateLimit({ windowMs = 10 * 60 * 1000, max = 10 } = {}) {
  return (req, res, next) => {
    // Login e (ip + email), authenticated endpoint e (ip + user id) —
    // change-password e email body-te thake na, tai shudhu IP dile
    // dui-jon user ek-i bucket e lock hoye jeto
    const ident = req.user?.id ?? String(req.body?.email || "").toLowerCase();
    const key = `${req.ip}|${ident}`;
    const now = Date.now();
    let e = hits.get(key);
    if (!e || now > e.reset) {
      e = { count: 0, reset: now + windowMs };
      hits.set(key, e);
    }
    e.count++;
    if (e.count > max) {
      return res.status(429).json({ error: "Onek bar try hoyeche — kichu khon por abar try korun" });
    }
    next();
  };
}
