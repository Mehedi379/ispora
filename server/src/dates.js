// Local date (server er timezone, BD = UTC+6).
// toISOString().slice(0,10) UTC date dito — rat 12ta (local) er por create kora
// invoice/payment er date ekdin piche chole jaito.
export const ymd = (d) => {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
};
