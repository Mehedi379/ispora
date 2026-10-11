import "dotenv/config";
import { prisma } from "./db.js";
import { hashPassword } from "./auth.js";

const zones = ["Mirpur", "Dhanmondi", "Uttara", "Gulshan", "Mohakhali"];
const packages = [
  { name: "Starter", speed: "10 Mbps", price: 500, validity: 30 },
  { name: "Home Plus", speed: "20 Mbps", price: 800, validity: 30 },
  { name: "Pro", speed: "40 Mbps", price: 1200, validity: 30 },
  { name: "Business", speed: "100 Mbps", price: 3000, validity: 30 },
];
const names = [
  "Rahim Uddin", "Karim Sheikh", "Jamal Hossain", "Nasir Ahmed", "Sumon Das",
  "ফারুক আহমেদ", "Tanvir Islam", "Mehedi Hasan", "Rakib Khan", "Shuvo Roy",
  "Arif Chowdhury", "Babul Mia", "Jewel Rana", "Sohel Rana", "Milon Hossain",
];
const statuses = ["active", "active", "active", "due", "expired", "suspended"];

async function main() {
  console.log("Seeding ISPora database...");

  // Users (login)
  await prisma.user.upsert({
    where: { email: "admin@ispora.app" },
    update: {},
    create: {
      name: "Admin", email: "admin@ispora.app", role: "admin",
      password: await hashPassword("admin123"),
    },
  });
  await prisma.user.upsert({
    where: { email: "collector@ispora.app" },
    update: {},
    create: {
      name: "Collector", email: "collector@ispora.app", role: "collector",
      password: await hashPassword("collect123"),
    },
  });

  // Zones
  const zoneMap = {};
  for (const name of zones) {
    const z = await prisma.zone.upsert({ where: { name }, update: {}, create: { name } });
    zoneMap[name] = z.id;
  }

  // Packages
  const pkgMap = {};
  for (const p of packages) {
    const pkg = await prisma.package.upsert({ where: { name: p.name }, update: p, create: p });
    pkgMap[p.name] = pkg;
  }

  // Configuration lookups (default BD data) — createMany + skipDuplicates = idempotent
  const nameRows = (arr) => arr.map((name) => ({ name }));
  await prisma.connectionType.createMany({ data: nameRows(["UTP", "Optical Fiber", "Wireless"]), skipDuplicates: true });
  await prisma.clientType.createMany({ data: nameRows(["Home", "Corporate", "Personal", "Office"]), skipDuplicates: true });
  await prisma.protocolType.createMany({ data: nameRows(["PPPoE", "Static IP", "Hotspot", "DHCP"]), skipDuplicates: true });
  await prisma.billingStatus.createMany({ data: nameRows(["Prepaid", "Postpaid", "Free", "Waiver"]), skipDuplicates: true });
  await prisma.district.createMany({ data: nameRows(["Dhaka", "Gazipur", "Narayanganj", "Chattogram"]), skipDuplicates: true });
  await prisma.box.createMany({
    data: [
      { name: "Box-01", code: "B01", capacity: 16 },
      { name: "Box-02", code: "B02", capacity: 8 },
    ],
    skipDuplicates: true,
  });
  // Sub-zones (Zone-er niche) ar Upazila (District-er niche) — parent id lagbe
  const dhaka = await prisma.district.findUnique({ where: { name: "Dhaka" } });
  if (dhaka) {
    await prisma.upazila.createMany({
      data: nameRows(["Mirpur", "Dhanmondi", "Savar"]).map((u) => ({ ...u, districtId: dhaka.id })),
      skipDuplicates: true,
    });
  }
  // Sub-zones under Mirpur zone (zoneMap niche Zones block e banano hoy)
  if (zoneMap["Mirpur"]) {
    await prisma.subZone.createMany({
      data: nameRows(["Mirpur-1", "Mirpur-10", "Mirpur-12"]).map((s) => ({ ...s, zoneId: zoneMap["Mirpur"] })),
      skipDuplicates: true,
    });
  }

  // Clients (42) — same demo data shape
  const existing = await prisma.client.count();
  if (existing === 0) {
    for (let i = 0; i < 42; i++) {
      const pkg = packages[i % packages.length];
      const status = statuses[i % statuses.length];
      const zoneName = zones[i % zones.length];
      await prisma.client.create({
        data: {
          name: names[i % names.length],
          phone: `01${7 + (i % 3)}${String(10000000 + i * 137).slice(0, 8)}`,
          pppoe: `user${1001 + i}`,
          zoneId: zoneMap[zoneName],
          packageId: pkgMap[pkg.name].id,
          status,
          due: status === "due" || status === "expired" ? pkg.price : 0,
          online: status === "active" && i % 3 !== 0,
          expiry: new Date(`2026-10-${String((i % 28) + 1).padStart(2, "0")}`),
        },
      });
    }

    // Few invoices — normal ISP niyom: ei mash e issue, due date issue + 5 din
    const clients = await prisma.client.findMany({ take: 24, include: { package: true } });
    const now = new Date();
    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      // issue date: ei mash er bibhinno din (bhobisshoter date noy — ajke porjonto)
      const day = Math.min((i % 28) + 1, now.getDate());
      const issuedAt = new Date(now.getFullYear(), now.getMonth(), day);
      const dueDate = new Date(issuedAt);
      dueDate.setDate(dueDate.getDate() + 5);
      await prisma.invoice.create({
        data: {
          number: `INV-${2601 + i}`,
          amount: c.package?.price || 0,
          status: i % 4 === 0 ? "unpaid" : i % 4 === 1 ? "partial" : "paid",
          clientId: c.id,
          issuedAt,
          dueDate,
          note: "Monthly bill",
        },
      });
    }

    // Accounting entries
    const tx = [
      { type: "income", head: "Monthly Collection", amount: 642500 },
      { type: "expense", head: "Bandwidth Bill", amount: 185000 },
      { type: "expense", head: "Staff Salary", amount: 95000 },
      { type: "expense", head: "Office Rent", amount: 25000 },
      { type: "income", head: "New Connection Fee", amount: 42000 },
      { type: "expense", head: "Equipment", amount: 38000 },
    ];
    for (const t of tx) await prisma.transaction.create({ data: t });
  }

  console.log("Done. Login: admin@ispora.app / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
