export function todayIso(): string {
  return toIso(new Date());
}

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return toIso(new Date(y, m - 1, d + days));
}

/** "2026-11-07" → "07/11/2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

/** Numeración correlativa anual: P-2026-001, F-2026-001 */
export function formatDocNumber(prefix: "P" | "F", year: number, n: number): string {
  return `${prefix}-${year}-${String(n).padStart(3, "0")}`;
}
