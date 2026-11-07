import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatEuros } from "../money";
import type { ClientSnapshot, CompanySettings, Totals } from "../types";

export const ACCENT = "#1e3a5f";

export const s = StyleSheet.create({
  page: { padding: 36, paddingBottom: 56, fontSize: 9.5, fontFamily: "Helvetica", color: "#111" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  logo: { maxWidth: 150, maxHeight: 70, objectFit: "contain", marginBottom: 6 },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: ACCENT, marginBottom: 3 },
  muted: { color: "#555" },
  docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: ACCENT, textAlign: "right" },
  docMeta: { textAlign: "right", marginTop: 4 },
  boxes: { flexDirection: "row", gap: 12, marginBottom: 16 },
  box: { flex: 1, border: "1pt solid #cbd5e1", borderRadius: 4, padding: 8 },
  boxLabel: { fontSize: 7.5, color: "#64748b", textTransform: "uppercase", marginBottom: 3 },
  bold: { fontFamily: "Helvetica-Bold" },
  thead: { flexDirection: "row", backgroundColor: ACCENT, color: "#fff", paddingVertical: 5, paddingHorizontal: 6, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  row: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, borderBottom: "0.5pt solid #e2e8f0", alignItems: "center" },
  num: { textAlign: "right" },
  totals: { marginTop: 10, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 6, marginTop: 4, backgroundColor: ACCENT, color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 12 },
  notes: { marginTop: 18, padding: 8, backgroundColor: "#f1f5f9", borderRadius: 4, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: "#64748b" },
});

export function CompanyHeader({
  company,
  title,
  meta,
}: {
  company: CompanySettings;
  title: string;
  meta: { label: string; value: string }[];
}) {
  return (
    <View style={s.header} fixed>
      <View style={{ maxWidth: 300 }}>
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
      <View>
        <Text style={s.docTitle}>{title}</Text>
        {meta.map((m) => (
          <Text key={m.label} style={s.docMeta}>
            <Text style={s.muted}>{m.label}: </Text>
            <Text style={s.bold}>{m.value}</Text>
          </Text>
        ))}
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

export function qty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString("es-ES", { maximumFractionDigits: 2 });
}
