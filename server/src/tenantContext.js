// Per-request tenant context — AsyncLocalStorage diye request-er bhitore kon
// tenant seta carry kori, jate db.js-er Prisma middleware auto-scope korte pare.
// Eta na thakle protita route-e manually tenantId pass korte hoto (50+ file).
import { AsyncLocalStorage } from "node:async_hooks";

export const tenantStore = new AsyncLocalStorage();

export const getTenantContext = () => tenantStore.getStore() || null;
export const getTenantId = () => tenantStore.getStore()?.tenantId ?? null;

// ctx = { tenantId, userId, role }. fn er bhitorer shob async kaj ei context pabe.
export const runWithTenant = (ctx, fn) => tenantStore.run(ctx, fn);
