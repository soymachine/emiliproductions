import type { DrawingParams, LeafType } from "./drawings/types";
import type { ArticleType, CompanySettings } from "./types";

export const DEFAULT_SETTINGS: CompanySettings = {
  name: "Emili - Carpintería Metálica",
  nif: "00000000T",
  address: "Calle Ejemplo, 1",
  postalCode: "00000",
  city: "Ciudad",
  province: "Provincia",
  phone: "600 000 000",
  email: "emili@ejemplo.com",
  iban: "",
  logoDataUrl: "",
  defaultVatRate: 21,
  quoteValidityDays: 30,
  quoteNotesTemplate: [
    "Pressupost vàlid per {DIES} dies",
    "Forma de pagament: 50% a l'acceptació del pressupost - Resta a la finalització de la feina amb la presentació de la factura",
    "El pagament es farà per transferència bancària al compte:",
    "{IBAN}",
  ].join("\n"),
  invoiceFooter: "Forma de pago: transferencia bancaria a la cuenta indicada.",
  quoteNumberFormat: "P-{AAAA}-{NNN}",
  invoiceNumberFormat: "F-{AAAA}-{NNN}",
};

export function drawing(
  kind: DrawingParams["kind"],
  leaves: LeafType[],
  extra: Partial<Omit<DrawingParams, "kind" | "leaves">> = {},
): DrawingParams {
  return { kind, leaves, topFixedMm: 0, bottomFixedMm: 0, sideLeftMm: 0, sideRightMm: 0, ...extra };
}

type Seed = Omit<ArticleType, "id" | "order" | "active">;

/** Catálogo inicial que se carga la primera vez. Emili puede editarlo y añadir más. */
export const SEED_ARTICLE_TYPES: Seed[] = [
  { name: "Ventana practicable 1 hoja", category: "ventana", drawing: drawing("ventana", ["izq"]), defaultWidthMm: 700, defaultHeightMm: 1000, defaultPriceCents: 0 },
  { name: "Ventana practicable 2 hojas", category: "ventana", drawing: drawing("ventana", ["izq", "dcha"]), defaultWidthMm: 1200, defaultHeightMm: 1200, defaultPriceCents: 0 },
  { name: "Ventana oscilobatiente 1 hoja", category: "ventana", drawing: drawing("ventana", ["oscilo-izq"]), defaultWidthMm: 700, defaultHeightMm: 1000, defaultPriceCents: 0 },
  { name: "Ventana oscilobatiente 2 hojas", category: "ventana", drawing: drawing("ventana", ["izq", "oscilo-dcha"]), defaultWidthMm: 1200, defaultHeightMm: 1200, defaultPriceCents: 0 },
  { name: "Ventana 3 hojas", category: "ventana", drawing: drawing("ventana", ["izq", "fijo", "dcha"]), defaultWidthMm: 1800, defaultHeightMm: 1200, defaultPriceCents: 0 },
  { name: "Ventana abatible", category: "ventana", drawing: drawing("ventana", ["abatible"]), defaultWidthMm: 800, defaultHeightMm: 500, defaultPriceCents: 0 },
  { name: "Corredera 2 hojas", category: "corredera", drawing: drawing("ventana", ["corredera-dcha", "corredera-izq"]), defaultWidthMm: 1500, defaultHeightMm: 1200, defaultPriceCents: 0 },
  { name: "Corredera 3 hojas", category: "corredera", drawing: drawing("ventana", ["corredera-dcha", "corredera-izq", "corredera-izq"]), defaultWidthMm: 2100, defaultHeightMm: 1200, defaultPriceCents: 0 },
  { name: "Corredera 4 hojas", category: "corredera", drawing: drawing("ventana", ["corredera-dcha", "corredera-dcha", "corredera-izq", "corredera-izq"]), defaultWidthMm: 2800, defaultHeightMm: 1200, defaultPriceCents: 0 },
  { name: "Corredera balconera 2 hojas", category: "corredera", drawing: drawing("puerta", ["corredera-dcha", "corredera-izq"]), defaultWidthMm: 1800, defaultHeightMm: 2200, defaultPriceCents: 0 },
  { name: "Corredera con fijos laterales", category: "corredera", drawing: drawing("ventana", ["corredera-dcha", "corredera-izq"], { sideLeftMm: 500, sideRightMm: 500 }), defaultWidthMm: 2500, defaultHeightMm: 1200, defaultPriceCents: 0 },
  { name: "Puerta 1 hoja", category: "puerta", drawing: drawing("puerta", ["izq"]), defaultWidthMm: 900, defaultHeightMm: 2100, defaultPriceCents: 0 },
  { name: "Puerta 2 hojas", category: "puerta", drawing: drawing("puerta", ["izq", "dcha"]), defaultWidthMm: 1500, defaultHeightMm: 2100, defaultPriceCents: 0 },
  { name: "Balconera 1 hoja oscilobatiente", category: "puerta", drawing: drawing("puerta", ["oscilo-izq"]), defaultWidthMm: 800, defaultHeightMm: 2200, defaultPriceCents: 0 },
  { name: "Balconera 2 hojas", category: "puerta", drawing: drawing("puerta", ["izq", "oscilo-dcha"]), defaultWidthMm: 1400, defaultHeightMm: 2200, defaultPriceCents: 0 },
  { name: "Puerta 1 hoja con fijo superior", category: "puerta", drawing: drawing("puerta", ["izq"], { topFixedMm: 400 }), defaultWidthMm: 900, defaultHeightMm: 2500, defaultPriceCents: 0 },
  { name: "Puerta 1 hoja con fijo lateral", category: "puerta", drawing: drawing("puerta", ["izq"], { sideRightMm: 400 }), defaultWidthMm: 1300, defaultHeightMm: 2100, defaultPriceCents: 0 },
  { name: "Fijo", category: "fijo", drawing: drawing("ventana", ["fijo"]), defaultWidthMm: 1000, defaultHeightMm: 1000, defaultPriceCents: 0 },
  { name: "Persiana / cajón", category: "otro", drawing: drawing("ninguno", []), defaultWidthMm: 1200, defaultHeightMm: 1200, defaultPriceCents: 0 },
  { name: "Mosquitera", category: "otro", drawing: drawing("ninguno", []), defaultWidthMm: 1200, defaultHeightMm: 1200, defaultPriceCents: 0 },
  { name: "Instalación / mano de obra", category: "otro", drawing: drawing("ninguno", []), defaultWidthMm: 0, defaultHeightMm: 0, defaultPriceCents: 0 },
  { name: "Retirada de carpintería antigua", category: "otro", drawing: drawing("ninguno", []), defaultWidthMm: 0, defaultHeightMm: 0, defaultPriceCents: 0 },
];

export const CATEGORY_LABELS: Record<ArticleType["category"], string> = {
  ventana: "Ventanas",
  corredera: "Correderas",
  puerta: "Puertas",
  fijo: "Fijos",
  otro: "Otros",
};

/** Rellena la plantilla de observaciones con los días de validez y el IBAN de Ajustes. */
export function fillQuoteNotes(s: Pick<CompanySettings, "quoteNotesTemplate" | "quoteValidityDays" | "iban">): string {
  return (s.quoteNotesTemplate ?? "")
    .replace(/\{DIES\}|\{DIAS\}|\{DÍAS\}/gi, String(s.quoteValidityDays || 30))
    .replace(/\{IBAN\}/gi, s.iban?.trim() || "ESXX XXXX XXXX XXXX XXXX XXXX");
}
