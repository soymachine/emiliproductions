import type { Client } from "./types";

export const normalizeText = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function matchesClient(
  c: Pick<Client, "name" | "nif" | "city" | "phone" | "email"> & { phone2?: string; code?: string },
  q: string,
): boolean {
  const needle = normalizeText(q.trim());
  if (!needle) return true;
  return [c.code ?? "", c.name, c.nif, c.city, c.phone, c.phone2 ?? "", c.email].some((f) => normalizeText(f).includes(needle));
}

/** Siguiente código de cliente: el número más alto + 1, conservando los ceros a la izquierda (0099 → 0100). */
export function nextClientCode(codes: string[]): string {
  let max = -1;
  let width = 1;
  for (const raw of codes) {
    const c = (raw ?? "").trim();
    if (!/^\d+$/.test(c)) continue;
    const n = Number(c);
    if (n > max || (n === max && c.length > width)) {
      max = n;
      width = c.length;
    }
  }
  if (max < 0) return "1";
  return String(max + 1).padStart(width, "0");
}

/** Códigos en uso (código → nombre del cliente), sin contar el cliente indicado. */
export function takenClientCodes(clients: Pick<Client, "id" | "name" | "code">[], exceptId?: string | null): Map<string, string> {
  const m = new Map<string, string>();
  for (const c of clients) {
    const code = (c.code ?? "").trim();
    if (code && c.id !== exceptId) m.set(code, c.name);
  }
  return m;
}
