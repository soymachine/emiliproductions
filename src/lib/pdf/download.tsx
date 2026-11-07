"use client";

import { loadChunk } from "../chunks";
import type { CompanySettings, Invoice, Quote } from "../types";

function safeName(s: string) {
  // Sin tildes ni símbolos: algunos navegadores ignoran el nombre si los lleva.
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w .-]+/g, "")
    .trim()
    .slice(0, 60);
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export interface BuiltPdf {
  blob: Blob;
  filename: string;
}

// La librería de PDF se carga solo cuando hace falta, para que la app arranque rápido.

export async function buildQuotePdf(quote: Quote, company: CompanySettings, layout: "compact" | "large" = "compact"): Promise<BuiltPdf> {
  const [{ pdf }, { QuotePdf }] = await loadChunk(() => Promise.all([import("@react-pdf/renderer"), import("./QuotePdf")]));
  const blob = await pdf(<QuotePdf quote={quote} company={company} layout={layout} />).toBlob();
  const suffix = layout === "large" ? " (dibujos grandes)" : "";
  return { blob, filename: `Presupuesto ${quote.number} ${safeName(quote.client.name)}${suffix}.pdf` };
}

export async function buildInvoicePdf(invoice: Invoice, company: CompanySettings): Promise<BuiltPdf> {
  const [{ pdf }, { InvoicePdf }] = await loadChunk(() => Promise.all([import("@react-pdf/renderer"), import("./InvoicePdf")]));
  const blob = await pdf(<InvoicePdf invoice={invoice} company={company} />).toBlob();
  return { blob, filename: `Factura ${invoice.number} ${safeName(invoice.client.name)}.pdf` };
}

export async function downloadQuotePdf(quote: Quote, company: CompanySettings, layout: "compact" | "large" = "compact") {
  const { blob, filename } = await buildQuotePdf(quote, company, layout);
  saveBlob(blob, filename);
}

export async function downloadInvoicePdf(invoice: Invoice, company: CompanySettings) {
  const { blob, filename } = await buildInvoicePdf(invoice, company);
  saveBlob(blob, filename);
}
