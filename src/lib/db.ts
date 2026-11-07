"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { DEFAULT_SETTINGS, SEED_ARTICLE_TYPES } from "./defaults";
import { formatDocNumber, yearOf } from "./dates";
import { computeTotals } from "./money";
import type {
  ArticleType,
  Client,
  ClientSnapshot,
  CompanySettings,
  Invoice,
  Payment,
  Quote,
} from "./types";
import { withPayment, withoutPayment } from "./payments";
import { frameColorLabel } from "./drawings/colors";

const col = (name: string) => collection(getDb(), name);

function withId<T>(snap: { id: string; data: () => unknown }): T {
  return { ...(snap.data() as object), id: snap.id } as T;
}

function stripId<T extends { id?: string }>(obj: T): Omit<T, "id"> {
  const { id: _id, ...rest } = obj;
  return rest;
}

export function newId(): string {
  return doc(col("_")).id;
}

// ---------- Ajustes ----------

export async function getSettings(): Promise<CompanySettings> {
  const snap = await getDoc(doc(getDb(), "settings", "company"));
  return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<CompanySettings> | undefined) };
}

export async function saveSettings(s: CompanySettings): Promise<void> {
  await setDoc(doc(getDb(), "settings", "company"), s);
}

/** Primera vez que se entra: crea los ajustes por defecto y el catálogo de artículos. */
export async function ensureInitialData(): Promise<void> {
  const settingsRef = doc(getDb(), "settings", "company");
  const snap = await getDoc(settingsRef);
  if (snap.exists()) return;
  const batch = writeBatch(getDb());
  batch.set(settingsRef, DEFAULT_SETTINGS);
  SEED_ARTICLE_TYPES.forEach((a, i) => {
    batch.set(doc(col("articleTypes")), { ...a, active: true, order: i });
  });
  await batch.commit();
}

// ---------- Numeración ----------

export type CounterKind = "quote" | "invoice";

const counterRef = (kind: CounterKind, year: number) => doc(getDb(), "counters", `${kind}-${year}`);

/** Último número usado en ese año (0 si todavía no hay ninguno). */
export async function getLastNumber(kind: CounterKind, year: number): Promise<number> {
  const snap = await getDoc(counterRef(kind, year));
  return (snap.data()?.last as number | undefined) ?? 0;
}

/**
 * Fija el último número usado (el siguiente documento será este + 1).
 * No deja bajarlo por debajo de lo que ya se ha numerado en la app, para no repetir números.
 */
export async function setLastNumber(kind: CounterKind, year: number, last: number): Promise<void> {
  if (!Number.isInteger(last) || last < 0) throw new Error("El número debe ser un entero igual o mayor que 0.");
  const coll = kind === "invoice" ? "invoices" : "quotes";
  const issued = await getDocs(
    query(col(coll), where("date", ">=", `${year}-01-01`), where("date", "<=", `${year}-12-31`)),
  );
  if (issued.size > 0) {
    const cur = await getLastNumber(kind, year);
    if (last < cur) {
      throw new Error(
        `Ya se han creado ${kind === "invoice" ? "facturas" : "presupuestos"} de ${year} en la app hasta el número ${cur}. ` +
          "Solo se puede subir la numeración, no bajarla, para no repetir números.",
      );
    }
  }
  await setDoc(counterRef(kind, year), { last });
}

async function numberFormats() {
  const s = await getSettings();
  return { quote: s.quoteNumberFormat, invoice: s.invoiceNumberFormat };
}

// ---------- Clientes ----------

export async function listClients(): Promise<Client[]> {
  const snap = await getDocs(query(col("clients"), orderBy("name")));
  return snap.docs.map((d) => withId<Client>(d));
}

export async function getClient(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(getDb(), "clients", id));
  return snap.exists() ? withId<Client>(snap) : null;
}

export async function saveClient(c: Omit<Client, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: number }): Promise<string> {
  const id = c.id ?? newId();
  const now = Date.now();
  await setDoc(doc(getDb(), "clients", id), { ...stripId(c), createdAt: c.createdAt ?? now, updatedAt: now });
  return id;
}

export async function deleteClient(id: string): Promise<void> {
  const q = await getDocs(query(col("quotes"), where("clientId", "==", id)));
  if (!q.empty) throw new Error("Este cliente tiene presupuestos o facturas y no se puede borrar.");
  await deleteDoc(doc(getDb(), "clients", id));
}

type ClientData = Omit<Client, "id" | "createdAt" | "updatedAt">;

/** Crea los clientes nuevos y actualiza los existentes (por lotes de 400 escrituras). */
export async function importClients(
  toCreate: ClientData[],
  toUpdate: { id: string; patch: Partial<ClientData> }[] = [],
): Promise<{ created: number; updated: number }> {
  const now = Date.now();
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = [
    ...toCreate.map((c) => (b: ReturnType<typeof writeBatch>) => b.set(doc(col("clients")), { ...c, createdAt: now, updatedAt: now })),
    ...toUpdate.map((u) => (b: ReturnType<typeof writeBatch>) => b.update(doc(getDb(), "clients", u.id), { ...u.patch, updatedAt: now })),
  ];
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(getDb());
    ops.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }
  return { created: toCreate.length, updated: toUpdate.length };
}

export function clientSnapshot(c: Client): ClientSnapshot {
  return {
    name: c.name,
    nif: c.nif,
    address: c.address,
    postalCode: c.postalCode,
    city: c.city,
    province: c.province,
    phone: c.phone,
    email: c.email,
  };
}

// ---------- Artículos ----------

export async function listArticleTypes(): Promise<ArticleType[]> {
  const snap = await getDocs(query(col("articleTypes"), orderBy("order")));
  return snap.docs.map((d) => withId<ArticleType>(d));
}

export async function saveArticleType(a: Omit<ArticleType, "id"> & { id?: string }): Promise<string> {
  const id = a.id ?? newId();
  await setDoc(doc(getDb(), "articleTypes", id), stripId(a));
  return id;
}

export async function deleteArticleType(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), "articleTypes", id));
}

// ---------- Presupuestos ----------

export async function listQuotes(): Promise<Quote[]> {
  const snap = await getDocs(query(col("quotes"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => withId<Quote>(d));
}

export async function getQuote(id: string): Promise<Quote | null> {
  const snap = await getDoc(doc(getDb(), "quotes", id));
  return snap.exists() ? withId<Quote>(snap) : null;
}

export type QuoteDraft = Omit<Quote, "id" | "number" | "createdAt" | "updatedAt" | "subtotalCents" | "vatCents" | "totalCents" | "invoiceId"> & {
  id?: string;
};

/** Guarda un presupuesto. Si es nuevo, le asigna el siguiente número del año (transacción). */
export async function saveQuote(draft: QuoteDraft): Promise<string> {
  const totals = computeTotals(draft.lines, draft.vatRate);
  const now = Date.now();
  if (draft.id) {
    const ref = doc(getDb(), "quotes", draft.id);
    const current = await getDoc(ref);
    if (current.exists() && (current.data() as Quote).status === "facturado") {
      throw new Error("Este presupuesto ya está facturado y no se puede modificar.");
    }
    await updateDoc(ref, { ...stripId(draft), ...totals, updatedAt: now });
    return draft.id;
  }
  const db = getDb();
  const ref = doc(col("quotes"));
  const year = yearOf(draft.date);
  const cRef = counterRef("quote", year);
  const formats = await numberFormats();
  await runTransaction(db, async (tx) => {
    const c = await tx.get(cRef);
    const next = ((c.data()?.last as number | undefined) ?? 0) + 1;
    tx.set(cRef, { last: next });
    tx.set(ref, {
      ...stripId(draft),
      ...totals,
      number: formatDocNumber(formats.quote, year, next),
      invoiceId: null,
      createdAt: now,
      updatedAt: now,
    });
  });
  return ref.id;
}

export async function setQuoteStatus(id: string, status: Quote["status"]): Promise<void> {
  await updateDoc(doc(getDb(), "quotes", id), { status, updatedAt: Date.now() });
}

export async function deleteQuote(id: string): Promise<void> {
  const q = await getQuote(id);
  if (q?.invoiceId) throw new Error("No se puede borrar un presupuesto facturado.");
  await deleteDoc(doc(getDb(), "quotes", id));
}

// ---------- Facturas ----------

export async function listInvoices(): Promise<Invoice[]> {
  const snap = await getDocs(query(col("invoices"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => withId<Invoice>(d));
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const snap = await getDoc(doc(getDb(), "invoices", id));
  return snap.exists() ? withId<Invoice>(snap) : null;
}

/**
 * Convierte un presupuesto en factura: número correlativo del año, copia de cliente y líneas
 * (sin dibujos), y marca el presupuesto como facturado. Todo en una única transacción.
 */
export async function convertQuoteToInvoice(quoteId: string, date: string, annotations = ""): Promise<string> {
  const db = getDb();
  const quoteRef = doc(db, "quotes", quoteId);
  const invoiceRef = doc(col("invoices"));
  const year = yearOf(date);
  const cRef = counterRef("invoice", year);
  const formats = await numberFormats();
  await runTransaction(db, async (tx) => {
    const qs = await tx.get(quoteRef);
    if (!qs.exists()) throw new Error("Presupuesto no encontrado.");
    const q = qs.data() as Quote;
    if (q.invoiceId) throw new Error("Este presupuesto ya tiene factura.");
    const c = await tx.get(cRef);
    const next = ((c.data()?.last as number | undefined) ?? 0) + 1;
    const invoice: Omit<Invoice, "id"> = {
      number: formatDocNumber(formats.invoice, year, next),
      date,
      quoteId,
      quoteNumber: q.number,
      clientId: q.clientId,
      client: q.client,
      lines: q.lines.map((l) => ({
        description: l.description,
        widthMm: l.widthMm,
        heightMm: l.heightMm,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        color: l.drawing.kind !== "ninguno" ? frameColorLabel(l.drawing.frameColor) : "",
      })),
      vatRate: q.vatRate,
      // Las observaciones del presupuesto no pasan a la factura; la factura tiene sus propias anotaciones.
      notes: "",
      annotations: annotations.trim(),
      ...computeTotals(q.lines, q.vatRate),
      status: "pendiente",
      paidAt: null,
      payments: [],
      paidCents: 0,
      createdAt: Date.now(),
    };
    tx.set(cRef, { last: next });
    tx.set(invoiceRef, invoice);
    tx.update(quoteRef, { status: "facturado", invoiceId: invoiceRef.id, updatedAt: Date.now() });
  });
  return invoiceRef.id;
}

/** Cambia las anotaciones de una factura (no afectan a los importes). */
export async function setInvoiceAnnotations(invoiceId: string, annotations: string): Promise<void> {
  await updateDoc(doc(getDb(), "invoices", invoiceId), { annotations: annotations.trim() });
}

/** Registra un cobro (total o parcial) de una factura. */
export async function addInvoicePayment(invoiceId: string, payment: Omit<Payment, "id">): Promise<void> {
  const db = getDb();
  const ref = doc(db, "invoices", invoiceId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Factura no encontrada.");
    tx.update(ref, withPayment(snap.data() as Invoice, { ...payment, id: newId() }));
  });
}

export async function removeInvoicePayment(invoiceId: string, paymentId: string): Promise<void> {
  const db = getDb();
  const ref = doc(db, "invoices", invoiceId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Factura no encontrada.");
    tx.update(ref, withoutPayment(snap.data() as Invoice, paymentId));
  });
}

// ---------- Copia de seguridad ----------

export async function exportBackup(): Promise<string> {
  const names = ["settings", "clients", "articleTypes", "quotes", "invoices", "counters"];
  const out: Record<string, unknown[]> = {};
  for (const n of names) {
    const snap = await getDocs(col(n));
    out[n] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return JSON.stringify({ exportedAt: new Date().toISOString(), ...out }, null, 2);
}

// ---------- Historial por cliente ----------

export async function listDocsByClient(clientId: string): Promise<{ quotes: Quote[]; invoices: Invoice[] }> {
  const [qs, is] = await Promise.all([
    getDocs(query(col("quotes"), where("clientId", "==", clientId))),
    getDocs(query(col("invoices"), where("clientId", "==", clientId))),
  ]);
  const byDate = <T extends { createdAt: number }>(a: T, b: T) => b.createdAt - a.createdAt;
  return {
    quotes: qs.docs.map((d) => withId<Quote>(d)).sort(byDate),
    invoices: is.docs.map((d) => withId<Invoice>(d)).sort(byDate),
  };
}
