import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { fillGdprText } from "../defaults";
import { formatEuros } from "../money";
import type { ClientSnapshot, CompanySettings, Totals } from "../types";

export const ACCENT = "#1e3a8a";

export const s = StyleSheet.create({
  page: { padding: 36, paddingBottom: 56, fontSize: 9.5, fontFamily: "Helvetica", color: "#111" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 18 },
  logo: { maxWidth: 150, maxHeight: 70, objectFit: "contain", marginBottom: 6 },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: ACCENT, marginBottom: 3 },
  muted: { color: "#555" },
  docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: ACCENT, textAlign: "right" },
  docMeta: { textAlign: "right", marginTop: 4 },
  boxes: { flexDirection: "row", gap: 12, marginBottom: 16 },
  box: { border: "1pt solid #cbd5e1", borderRadius: 4, padding: 8 },
  boxLabel: { fontSize: 7.5, color: "#64748b", textTransform: "uppercase", marginBottom: 3 },
  bold: { fontFamily: "Helvetica-Bold" },
  thead: { flexDirection: "row", backgroundColor: ACCENT, color: "#fff", paddingVertical: 5, paddingHorizontal: 6, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  row: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, borderBottom: "0.5pt solid #e2e8f0", alignItems: "center" },
  num: { textAlign: "right" },
  totals: { marginTop: 10, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 6, marginTop: 4, backgroundColor: ACCENT, color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 12 },
  notes: { marginTop: 18, padding: 8, backgroundColor: "#f1f5f9", borderRadius: 4 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: "#64748b" },
});

/**
 * Cabecera del documento: a la izquierda logo y datos de la empresa; a la derecha el título
 * (PRESUPUESTO / FACTURA), número y fechas y, debajo, los datos del cliente.
 * Solo sale en la primera página (no lleva `fixed`).
 */
export function CompanyHeader({
  company,
  title,
  meta,
  client,
}: {
  company: CompanySettings;
  title: string;
  meta: { label: string; value: string }[];
  client: ClientSnapshot;
}) {
  return (
    <View style={s.header}>
      <View style={{ flex: 1, maxWidth: 270 }}>
        {company.logoDataUrl ? <Image src={company.logoDataUrl} style={s.logo} /> : null}
        <Text style={s.companyName}>{company.name}</Text>
        <Text>NIF: {company.nif}</Text>
        <Text>{company.address}</Text>
        <Text>
          {company.postalCode} {company.city}
          {company.province ? ` (${company.province})` : ""}
        </Text>
        <Text style={s.muted}>
          {[company.phone, company.email].filter(Boolean).join(" · ")}
        </Text>
      </View>
      <View style={{ width: 245 }}>
        <Text style={s.docTitle}>{title}</Text>
        {meta.map((m) => (
          <Text key={m.label} style={s.docMeta}>
            <Text style={s.muted}>{m.label}: </Text>
            <Text style={s.bold}>{m.value}</Text>
          </Text>
        ))}
        <View style={{ marginTop: 10 }}>
          <ClientBox client={client} />
        </View>
      </View>
    </View>
  );
}

export function ClientBox({ client }: { client: ClientSnapshot }) {
  return (
    <View style={s.box}>
      <Text style={s.boxLabel}>Cliente</Text>
      <Text style={s.bold}>{client.name}</Text>
      {client.nif ? <Text>NIF/CIF: {client.nif}</Text> : null}
      {client.address ? <Text>{client.address}</Text> : null}
      {client.postalCode || client.city ? (
        <Text>
          {client.postalCode} {client.city}
          {client.province ? ` (${client.province})` : ""}
        </Text>
      ) : null}
      {client.phone || client.email ? <Text style={s.muted}>{[client.phone, client.email].filter(Boolean).join(" · ")}</Text> : null}
    </View>
  );
}

export function TotalsBlock({ totals, vatRate }: { totals: Totals; vatRate: number }) {
  return (
    <View style={s.totals} wrap={false}>
      <View style={s.totalRow}>
        <Text>Base imponible</Text>
        <Text>{formatEuros(totals.subtotalCents)}</Text>
      </View>
      <View style={s.totalRow}>
        <Text>IVA {vatRate}%</Text>
        <Text>{formatEuros(totals.vatCents)}</Text>
      </View>
      <View style={s.grandTotal}>
        <Text>TOTAL</Text>
        <Text>{formatEuros(totals.totalCents)}</Text>
      </View>
    </View>
  );
}

export function Footer({ text }: { text: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>{text}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );
}

export function measures(widthMm: number, heightMm: number): string {
  return widthMm > 0 && heightMm > 0 ? `${widthMm} × ${heightMm} mm` : "";
}

/** «Medidas: 1500 × 1200 mm · Color: Antracita (RAL 7016)», o cadena vacía si no hay nada. */
export function measuresLine(widthMm: number, heightMm: number, color?: string): string {
  const parts = [measures(widthMm, heightMm) ? `Medidas: ${measures(widthMm, heightMm)}` : "", color ? `Color: ${color}` : ""];
  return parts.filter(Boolean).join(" · ");
}

export function qty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

/** Texto RGPD en letra pequeña al final del documento. */
export function GdprText({ company }: { company: CompanySettings }) {
  const text = fillGdprText(company);
  if (!text) return null;
  return (
    <View style={{ marginTop: 18, paddingTop: 6, borderTop: "0.5pt solid #e2e8f0" }}>
      <Text style={{ fontSize: 6.5, lineHeight: 1.35, color: "#64748b" }}>{text}</Text>
    </View>
  );
}

/** Descripción de una línea: la primera línea en negrita y el resto normal, respetando los saltos. */
export function LineDescription({ text }: { text: string }) {
  const [first, ...rest] = (text || "").split("\n");
  return (
    <>
      <Text style={s.bold}>{first}</Text>
      {rest.length ? <Text>{rest.join("\n")}</Text> : null}
    </>
  );
}
