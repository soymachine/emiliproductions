import type { Totals } from "./types";

/** Todos los importes se guardan en céntimos (enteros) para evitar errores de redondeo. */

const eurFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  useGrouping: "always",
});

export function formatEuros(cents: number): string {
  return eurFormatter.format(cents / 100);
}

/** Convierte un texto escrito por el usuario ("1.234,56", "1234.5", "99") a céntimos. */
export function parseEurosToCents(input: string): number | null {
  let s = input.trim().replace(/\s|€/g, "");
  if (!s) return null;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // El último separador es el decimal.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hasComma) {
    s = s.replace(",", ".");
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.234" → miles
    s = s.replace(/\./g, "");
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 100);
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function lineTotalCents(quantity: number, unitPriceCents: number): number {
  return Math.round(quantity * unitPriceCents);
}

export function computeTotals(
  lines: { quantity: number; unitPriceCents: number }[],
  vatRate: number,
): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + lineTotalCents(l.quantity, l.unitPriceCents), 0);
  const vatCents = Math.round((subtotalCents * vatRate) / 100);
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}
