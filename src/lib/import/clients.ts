import type { Client } from "../types";

import { normalizeText } from "../search";

export type ImportField =
  | "code"
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

export const IMPORT_FIELDS: { key: ImportField; label: string; synonyms: string[]; exclude?: string[] }[] = [
  // El primero: así «Código cliente» no lo coge el campo nombre (sinónimo «cliente»).
  {
    key: "code",
    label: "Código de cliente",
    synonyms: ["codigo", "cod", "cod.", "codigo cliente", "cod. cliente", "cod cliente", "n cliente", "nº cliente", "no cliente", "num cliente", "numero cliente", "num. cliente", "id cliente", "numero"],
    exclude: ["postal", "pais", "iban", "banco", "telefono", "movil", "fax", "cuenta"],
  },
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
    .replace(/[.º°ª]/g, "") // «C.I.F.» = «cif», «Nº cliente» = «n cliente»
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
        (h, i) =>
          !used.has(i) &&
          !(f.exclude ?? []).some((x) => h.includes(x)) &&
          f.synonyms.map(norm).some((syn) => (exact ? h === syn : syn.length >= 5 && h.includes(syn))),
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

/** Excel a veces entrega los números como «123.0»: se deja en «123». */
export function normalizeCode(v: string): string {
  const s = v.trim();
  return /^\d+\.0+$/.test(s) ? s.replace(/\.0+$/, "") : s;
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
        code: normalizeCode(get(row, "code")),
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

type ExistingClient = Omit<Client, "createdAt" | "updatedAt">;

export interface ImportPlan {
  toCreate: ImportedClient[];
  toUpdate: { id: string; name: string; patch: Partial<ImportedClient> }[];
  /** Ya existían y no hay nada que cambiar (o se ha elegido saltarlos). */
  unchanged: number;
}

const FILLABLE: (keyof ImportedClient)[] = ["nif", "address", "postalCode", "city", "province", "phone", "phone2", "email", "notes"];

/**
 * Empareja los clientes del fichero con los que ya hay en la app (por NIF y, si no tiene, por nombre).
 * - update: a los existentes se les pone el código y se rellenan los campos que estén vacíos, sin pisar nada.
 * - skip: los existentes se dejan como están.
 * Los repetidos dentro del propio fichero solo se crean una vez.
 */
export function planImport(imported: ImportedClient[], existing: ExistingClient[], mode: "update" | "skip"): ImportPlan {
  const byNif = new Map<string, ExistingClient>();
  const byName = new Map<string, ExistingClient>();
  for (const e of existing) {
    const n = normalizeNif(e.nif || "");
    if (n) byNif.set(n, e);
    byName.set(normalizeText(e.name).trim(), e);
  }
  const plan: ImportPlan = { toCreate: [], toUpdate: [], unchanged: 0 };
  const seen = new Set<string>();
  const updated = new Set<string>();

  for (const c of imported) {
    const nif = normalizeNif(c.nif);
    const nameKey = normalizeText(c.name).trim();
    const key = nif ? `nif:${nif}` : `name:${nameKey}`;
    if (seen.has(key)) {
      plan.unchanged++;
      continue;
    }
    seen.add(key);

    const match = nif ? byNif.get(nif) ?? (byName.get(nameKey)?.nif ? undefined : byName.get(nameKey)) : byName.get(nameKey);
    if (!match) {
      plan.toCreate.push(c);
      continue;
    }
    if (mode === "skip" || updated.has(match.id)) {
      plan.unchanged++;
      continue;
    }
    const patch: Partial<ImportedClient> = {};
    if (c.code && c.code !== match.code) patch.code = c.code;
    for (const f of FILLABLE) {
      if (!String(match[f] ?? "").trim() && String(c[f] ?? "").trim()) (patch as Record<string, string>)[f] = c[f] as string;
    }
    if (Object.keys(patch).length) {
      plan.toUpdate.push({ id: match.id, name: match.name, patch });
      updated.add(match.id);
    } else plan.unchanged++;
  }
  return plan;
}
