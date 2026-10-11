// Brand — change here anytime
export const BRAND = {
  name: "ISPora",
  tagline: "Smart ISP Billing & Management",
  short: "IS",
};

// Purano mock data (42 ta fake client/invoice/package) ekhon remove —
// sob data API theke ashe, static list rakhle bhul data chole ashar risk
// Client dropdown label — pppoe unique (DB constraint), tai duplicate
// naam hoileo option unique thakbe, ar id diye select korte parbo
export const clientLabel = (c) => `${c.name} (${c.pppoe || `id ${c.id}`})`;

export const statusStyle = {
  active: "text-emerald-500 bg-emerald-500/10",
  due: "text-amber-500 bg-amber-500/10",
  expired: "text-rose-500 bg-rose-500/10",
  suspended: "text-slate-400 bg-slate-400/10",
  paid: "text-emerald-500 bg-emerald-500/10",
  unpaid: "text-rose-500 bg-rose-500/10",
  partial: "text-amber-500 bg-amber-500/10",
};
