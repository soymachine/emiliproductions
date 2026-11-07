import type { DrawingParams } from "./drawings/types";

export type VatRate = 21 | 10;

export interface CompanySettings {
  name: string;
  nif: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  iban: string;
  /** Logo redimensionado guardado como data URL (sin Cloud Storage, plan gratuito). */
  logoDataUrl: string;
  defaultVatRate: VatRate;
  /** Días de validez por defecto de un presupuesto. */
  quoteValidityDays: number;
  /**
   * Texto que se pone en las observaciones de cada presupuesto nuevo (editable en cada uno).
   * {DIES} = días de validez · {IBAN} = cuenta bancaria.
   */
  quoteNotesTemplate: string;
  /** Texto legal de protección de datos (RGPD), en pequeño al final de presupuestos y facturas. */
  gdprText: string;
  /** Plantilla del número de presupuesto, p. ej. "P-{AAAA}-{NNN}". */
  quoteNumberFormat: string;
  /** Plantilla del número de factura, p. ej. "F-{AAAA}-{NNN}". */
  invoiceNumberFormat: string;
  invoiceFooter: string;
}

export type ClientKind = "particular" | "empresa";

export interface Client {
  id: string;
  /** Código o número de cliente (se conserva el de InGnio al importar). Texto para no perder ceros ni letras. */
  code: string;
  kind: ClientKind;
  name: string;
  nif: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  phone: string;
  phone2: string;
  email: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

/** Copia de los datos del cliente guardada dentro del documento (no cambia si luego se edita la ficha). */
export type ClientSnapshot = Pick<
  Client,
  "name" | "nif" | "address" | "postalCode" | "city" | "province" | "phone" | "email"
>;

export type ArticleCategory = "ventana" | "corredera" | "puerta" | "fijo" | "otro";

export interface ArticleType {
  id: string;
  name: string;
  category: ArticleCategory;
  drawing: DrawingParams;
  defaultWidthMm: number;
  defaultHeightMm: number;
  /** Precio orientativo en céntimos. */
  defaultPriceCents: number;
  active: boolean;
  order: number;
}

export interface QuoteLine {
  id: string;
  articleTypeId: string | null;
  description: string;
  drawing: DrawingParams;
  widthMm: number;
  heightMm: number;
  quantity: number;
  unitPriceCents: number;
}

export interface Totals {
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
}

export type QuoteStatus = "borrador" | "enviado" | "aceptado" | "rechazado" | "facturado";

export interface Quote extends Totals {
  id: string;
  number: string;
  date: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  status: QuoteStatus;
  clientId: string;
  client: ClientSnapshot;
  lines: QuoteLine[];
  vatRate: VatRate;
  notes: string;
  invoiceId: string | null;
  createdAt: number;
  updatedAt: number;
}

export type InvoiceLine = Omit<QuoteLine, "drawing" | "articleTypeId" | "id">;

export type InvoiceStatus = "pendiente" | "pagada";

export interface Invoice extends Totals {
  id: string;
  number: string;
  date: string;
  quoteId: string;
  quoteNumber: string;
  clientId: string;
  client: ClientSnapshot;
  lines: InvoiceLine[];
  vatRate: VatRate;
  notes: string;
  status: InvoiceStatus;
  paidAt: string | null;
  createdAt: number;
}
