import type { Client } from "./types";

export const normalizeText = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function matchesClient(c: Pick<Client, "name" | "nif" | "city" | "phone" | "email"> & { phone2?: string }, q: string): boolean {
  const needle = normalizeText(q.trim());
  if (!needle) return true;
  return [c.name, c.nif, c.city, c.phone, c.phone2 ?? "", c.email].some((f) => normalizeText(f).includes(needle));
}
