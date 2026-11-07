import type { Client } from "../types";

export type ImportField =
  | "name"
  | "nif"
  | "address"
  | "postalCode"
  | "city"
  | "province"
  | "phone"
  | "phone2"
  | "email"
  | "notes";

export const IMPORT_FIELDS: { key: ImportField; label: string; synonyms: string[] }[] = [
  { key: "name", label: "Nombre / Razón social", synonyms: ["nombre", "razon social", "razonsocial", "cliente", "nombre fiscal", "nombre comercial", "denominacion"] },
  { key: "nif", label: "NIF / CIF", synonyms: ["nif", "cif", "dni", "nif/cif", "cif/nif", "nie", "documento"] },
  { key: "address", label: "Dirección", synonyms: ["direccion", "domicilio", "calle", "direccion fiscal"] },
  { key: "postalCode", label: "Código postal", synonyms: ["cp", "c.p.", "codigo postal", "cod postal", "cod. postal", "postal"] },
  { key: "city", label: "Población", synonyms: ["poblacion", "localidad", "ciudad", "municipio"] },
  { key: "province", label: "Provincia", synonyms: ["provincia"] },
  { key: "phone", label: "Teléfono", synonyms: ["telefono", "telefono 1", "telefono1", "tel", "tlf", "movil", "tfno"] },
  { key: "phone2", label: "Teléfono 2", synonyms: ["telefono 2", "telefono2", "tel2", "movil 2", "fax"] },
  { key: "email", label: "Email", synonyms: ["email", "e-mail", "correo", "correo electronico", "mail"] },
  { key: "notes", label: "Notas", synonyms: ["notas", "observaciones", "comentarios"] },
];

export type Mapping = Partial<Record<ImportField, number>>;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[_\s]+/g, " ")
    .trim();

/** Adivina qué columna del fichero corresponde a cada campo, según el texto de la cabecera. */
export function guessMapping(headers: string[]): Mapping {
  const mapping: Mapping = {};
  const used = new Set<number>();
  const normalized = headers.map(norm);
  // Primero coincidencias exactas, luego parciales.
  for (const exact of [true, false]) {
    for (const f of IMPORT_FIELDS) {
      if (mapping[f.key] !== undefined) continue;
      const idx = normalized.findIndex(
        (h, i) => !used.has(i) && f.synonyms.some((syn) => (exact ? h === syn : h.includes(syn))),
      );
      if (idx >= 0) {
        mapping[f.key] = idx;
        used.add(idx);
      }
    }
  }
  return mapping;
}

export function normalizeNif(nif: string): string {
  return nif.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export type ImportedClient = Omit<Client, "id" | "createdAt" | "updatedAt">;

/** Detecta empresa por la letra inicial del CIF (A, B, C... ) o por la forma jurídica en el nombre. */
export function guessKind(nif: string, name: string): Client["kind"] {
  const n = normalizeNif(nif);
  if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(n)) return "empresa";
  if (/\b(s\.?l\.?u?|s\.?a\.?|s\.?c\.?|c\.?b\.?|sociedad|comunidad)\b\.?$/i.test(name.trim())) return "empresa";
  return "particular";
}

export function rowsToClients(rows: string[][], mapping: Mapping): ImportedClient[] {
  const get = (row: string[], f: ImportField) => {
    const idx = mapping[f];
    return idx === undefined ? "" : String(row[idx] ?? "").trim();
  };
  return rows
    .map((row) => {
      const name = get(row, "name");
      const nif = get(row, "nif").toUpperCase();
      return {
        kind: guessKind(nif, name),
        name,
        nif,
        address: get(row, "address"),
        postalCode: get(row, "postalCode"),
        city: get(row, "city"),
        province: get(row, "province"),
        phone: get(row, "phone"),
        phone2: get(row, "phone2"),
        email: get(row, "email"),
        notes: get(row, "notes"),
      };
    })
    .filter((c) => c.name.length > 0);
}

/**
 * Decodifica un CSV: los programas de escritorio españoles suelen exportar en Windows-1252,
 * así que si no es UTF-8 válido se reintenta con esa codificación.
 */
export function decodeText(buf: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}
