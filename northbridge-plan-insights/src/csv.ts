/** Downloads rows as a CSV file, headed with a sample-data notice. */
export function downloadCsv(filename: string, head: string[], rows: (string | number | null)[][]) {
  const cell = (c: string | number | null) => `"${String(c ?? "").replace(/"/g, '""')}"`;
  const csv = [head, ...rows].map((r) => r.map(cell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`# Sample data - fictional plan\n${csv}\n`], { type: "text/csv" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.parentNode?.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const usdShort = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `$${Math.round(n / 1000)}K` : usd(n);
