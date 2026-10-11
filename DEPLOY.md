# 🚀 ISPora — Free te live deploy guide (2026)

**Stack (puro free, credit card lagbe na):**

| Layer | Provider | Free limit | Catch |
|---|---|---|---|
| Backend | Render (Web Service) | 750 ghonta/mo, 512MB | 15 min por sleep → first request ~40-50s (cold start) |
| Database | Neon Postgres | ~0.5GB persistent | 5 min idle e autosuspend (first query ektu slow) |
| Frontend | Cloudflare Pages | Unlimited bandwidth, 500 builds/mo | Kono na |

> Keno Postgres? Render free host-e disk **ephemeral** — SQLite file restart-e ure jay. Tai SQLite → Postgres switch kora hoyeche.

---

## Step 1 — GitHub repo (dorkar: deploy platform sob GitHub theke pull kore)

```bash
git init
git add .
git commit -m "ISPora: initial commit"
# GitHub-e notun private repo banan (browser e) tarpor:
git remote add origin https://github.com/<tumar-username>/<repo>.git
git branch -M main
git push -u origin main
```

`.env`, `dev.db`, `node_modules`, `dist` — sob .gitignore te ache, secret/DB file push hobe na.

## Step 2 — Neon (database)

1. [neon.tech](https://neon.tech) → free account → New project
2. Connection string copy koren — **"Pooled"** URL (`postgresql://...pooler...`) nicchen
3. Oita safe rakhen, Step 3-e lagbe: `DATABASE_URL`

## Step 3 — Render (backend)

1. [render.com](https://render.com) → **New → Blueprint** → GitHub repo connect
2. `render.yaml` auto-detect hobe. Deploy-er **age** Environment tab-e:
   - `DATABASE_URL` = Neon er pooled URL
   - `CLIENT_ORIGIN` = frontend er URL (Step 5-er por paya jabe, age `/` dileo hobe)
   - `JWT_SECRET` = auto-generate (render.yaml `generate: true`)
3. **Deploy** — build command `prisma db push` diye Neon e **schema auto-create** hobe
4. URL peye jaben: `https://ispora-api-xxxx.onrender.com` (nicher Step 5-e lagbe)

Manually korle (Blueprint na chahile): New → Web Service → Root Directory `server`, baki command gula render.yaml theke copy.

## Step 4 — Data + admin login

**Path A — purano dev data live korte chao** (44 clients, 3 users, settings sob):
```bash
cd server
DATABASE_URL="<neon pooled url>" node src/sqliteToPostgres.js
```
(Node 22+ lagbe. Import shesh e "Done — N ta row" dekhabe. Already data thakle script nijei refuse kore.)

**Path B — fresh start:**
```bash
cd server
DATABASE_URL="<neon pooled url>" npm run seed
```
→ Login: `admin@ispora.app` / `admin123`

**⚡ Login er por obosshoi password change** (eta public seed-cred):
Sidebar → **Settings → My Account** tab → current `admin123` + notun 6+ char password → **Change Password**. UI thekei hoy, curl lagbe na.

## Step 5 — Cloudflare Pages (frontend)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git** → repo select
2. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`
3. **Settings → Environment variables:**
   - `VITE_API_URL` = `https://ispora-api-xxxx.onrender.com/api`
4. Save → Deploy. URL: `https://<project>.pages.dev`

`public/_redirects` ache — React Router (SPA) routes (`/clients`, `/invoices`) direct-e open korle 404 hobe na.

## Step 6 — CORS connect (last mile)

1. Render → ispora-api → Environment → `CLIENT_ORIGIN` = `https://<project>.pages.dev`
2. **Deploy → Retry deploy** (env change rebuild lagbe)

## Step 7 — Verify

- `https://ispora-api-xxxx.onrender.com/api/health` → `{"ok":true,...}`
- Frontend theke login → dashboard, client create, payment collect, void
- SSL/https dono-e auto ✅

---

## ⚠️ Free plan er reality check

- **Render sleep:** 15 min kichu na chalale bondho (puro 750h/mo kharch hoy). First request ~40s — normal. Client 15s timeout ache, tai **cold start e timeout ashbe** — dui-ekbar reload dile chole asbe. Beshi user hole Render Starter $7/mo.
- **Status sweep:** server start-e + 12 ghonta por por chalay — sleep e thakle porer wake-e automatically chalbe (start-ei ekbar chalay).
- **JWT_SECRET:** Render auto-generate kore; local `.env` er secret **live-e kaj korbe na** (by design — server start-ei thakbe, age fix kora).
- **Migration history:** `prisma/migrations/0_init` ekhon Postgres baseline (schema theke generate). Deploy-e thin `db push` use hocche (existing DB te migrate deploy dile table already thakle conflict korbe) — notun DB te duitae-i kaj korbe.
- **Backup:** Neon dashboard-e instant backup/restore ache. `dev.db` local backup hishebe ache.
