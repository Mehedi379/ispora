// One-off: purono demo invoice-er bhul/bhobisshoter date thik kori ar missing due date boshai
import { prisma } from "./db.js";

async function main() {
  const now = new Date();
  const invoices = await prisma.invoice.findMany();
  let fixed = 0;
  for (const inv of invoices) {
    const data = {};
    // issue date bhobisshote thakle ajker date e nijei ani
    if (inv.issuedAt > now) data.issuedAt = now;
    const issue = data.issuedAt || inv.issuedAt;
    // due date na thakle issue + 5 din
    if (!inv.dueDate) {
      const d = new Date(issue);
      d.setDate(d.getDate() + 5);
      data.dueDate = d;
    }
    if (Object.keys(data).length) {
      await prisma.invoice.update({ where: { id: inv.id }, data });
      fixed++;
    }
  }
  console.log(`[fixInvoiceDates] ${fixed} invoice-er date thik kora holo (total ${invoices.length})`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
