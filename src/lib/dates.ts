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

/**
 * Formatea un número de documento según una plantilla:
 * - {AAAA}: año con 4 cifras (2026)
 * - {AA}: año con 2 cifras (26)
 * - {N}, {NN}, {NNN}…: número correlativo, rellenado con ceros hasta esa cantidad de cifras
 * Ej.: "F-{AAAA}-{NNN}" → F-2026-001 · "{AA}/{NNNN}" → 26/0123
 */
export function formatDocNumber(template: string, year: number, n: number): string {
  let out = (template || "{NNN}").replace(/\{AAAA\}/g, String(year)).replace(/\{AA\}/g, String(year).slice(-2));
  let replaced = false;
  out = out.replace(/\{(N+)\}/g, (_, ns: string) => {
    replaced = true;
    return String(n).padStart(ns.length, "0");
  });
  return replaced ? out : out + String(n);
}

/** Comprueba que la plantilla incluye el número correlativo. */
export function isValidNumberFormat(template: string): boolean {
  return /\{N+\}/.test(template);
}

export type RangePreset = "mes" | "trimestre" | "año" | "año-pasado";

/** Rango de fechas (ISO, ambos incluidos) de los atajos del filtro. */
export function rangePreset(preset: RangePreset, todayIsoStr: string = todayIso()): { from: string; to: string } {
  const [y, m] = todayIsoStr.split("-").map(Number);
  const lastDay = (yy: number, mm: number) => toIso(new Date(yy, mm, 0)); // mm 1-12 → último día del mes
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (preset) {
    case "mes":
      return { from: `${y}-${pad(m)}-01`, to: lastDay(y, m) };
    case "trimestre": {
      const q0 = Math.floor((m - 1) / 3) * 3 + 1;
      return { from: `${y}-${pad(q0)}-01`, to: lastDay(y, q0 + 2) };
    }
    case "año":
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    case "año-pasado":
      return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
  }
}
