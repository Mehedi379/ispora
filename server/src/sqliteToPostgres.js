// One-off: purano SQLite dev.db theke PostgreSQL (Neon) e shob data copy.
// Use:  DATABASE_URL="<neon postgres url>" node src/sqliteToPostgres.js [path/to/dev.db]
// (Node 22+ lagbe — node:sqlite built-in. Experimental warning thakbe, ignore korte parben.)
import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import { prisma } from "./db.js";

const SRC = process.argv[2] || "prisma/dev.db";

// Order = FK dependency order. dates = epoch-ms columns, bools = 0/1 columns
const TABLES = [
  { model: "zone", table: "Zone", dates: [], bools: [] },
  { model: "package", table: "Package", dates: [], bools: ["active"] },
  { model: "user", table: "User", dates: ["createdAt"], bools: ["active"] },
  { model: "client", table: "Client", dates: ["expiry", "createdAt", "deletedAt"], bools: ["online"] },
  { model: "invoice", table: "Invoice", dates: ["issuedAt", "dueDate"], bools: [] },
  { model: "payment", table: "Payment", dates: ["paidAt"], bools: [] },
  { model: "transaction", table: "Transaction", dates: ["date"], bools: [] },
  { model: "setting", table: "Setting", dates: [], bools: [] },
  { model: "ticket", table: "Ticket", dates: ["createdAt", "updatedAt"], bools: [] },
  { model: "netDevice", table: "NetDevice", dates: ["createdAt"], bools: [] },
];

// id preserve korchi (FK references thik thake), tai explicit id diye insert
const mapRow = (row, cfg) => {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) out[k] = null;
    else if (cfg.dates.includes(k)) out[k] = new Date(Number(v));
    else if (cfg.bools.includes(k)) out[k] = !!v;
    else out[k] = v;
  }
  return out;
};

async function main() {
  let src;
  try {
    src = new DatabaseSync(SRC);
  } catch {
    console.error(`Source khujte parina: ${SRC}`);
    process.exit(1);
  }

  // Target khali naki — na hole duplicate/FK error hobe
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("Target DB te already user ache — import cancel kora holo (duplicate rokhte).");
    console.log("Notun/empty Neon DB use korun ba existing data thakle ei script chalaben na.");
    process.exit(0);
  }

  let total = 0;
  for (const cfg of TABLES) {
    const rows = src.prepare(`SELECT * FROM "${cfg.table}"`).all().map((r) => mapRow(r, cfg));
    if (rows.length) {
      await prisma[cfg.model].createMany({ data: rows });
      total += rows.length;
    }
    console.log(`  ${cfg.table}: ${rows.length}`);
  }

  // Prisma explicitly id dile Postgres sequence advance kore na — nahole notun insert e id clash
  const SEQ_TABLES = ["Zone", "Package", "User", "Client", "Invoice", "Payment", "Transaction", "Ticket", "NetDevice"];
  for (const t of SEQ_TABLES) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${t}"', 'id'), COALESCE((SELECT MAX(id) FROM "${t}"), 1))`
    );
  }

  src.close();
  console.log(`Done — ${total} ta row import holo. Sequence gulao reset. Ekhon app normal chalabe.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Import fail:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
