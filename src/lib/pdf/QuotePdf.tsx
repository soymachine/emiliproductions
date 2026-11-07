import { Document, Page, Text, View } from "@react-pdf/renderer";
import { DrawingPdf } from "../drawings/DrawingPdf";
import { formatDate } from "../dates";
import { formatEuros, lineTotalCents } from "../money";
import type { CompanySettings, Quote } from "../types";
import { frameColorLabel } from "../drawings/colors";
import { fillQuoteNotes } from "../defaults";
import { CompanyHeader, Footer, GdprText, LineDescription, measuresLine, qty, s, TotalsBlock } from "./common";

const COL = { drawing: 115, desc: 1, qty: 40, price: 70, amount: 75 };

/** compact: dibujo pequeño al lado de la información · large: dibujo grande debajo de cada línea. */
export type QuotePdfLayout = "compact" | "large";

export function QuotePdf({ quote, company, layout = "compact" }: { quote: Quote; company: CompanySettings; layout?: QuotePdfLayout }) {
  const large = layout === "large";
  return (
    <Document title={`Presupuesto ${quote.number}`} author={company.name}>
      <Page size="A4" style={s.page}>
        <CompanyHeader
          company={company}
          client={quote.client}
          title="PRESUPUESTO"
          meta={[
            { label: "Nº", value: quote.number },
            { label: "Fecha", value: formatDate(quote.date) },
            { label: "Válido hasta", value: formatDate(quote.validUntil) },
          ]}
        />

        <View style={s.thead}>
          {!large ? <Text style={{ width: COL.drawing }}>Dibujo</Text> : null}
          <Text style={{ flex: COL.desc }}>Descripción</Text>
          <Text style={[{ width: COL.qty }, s.num]}>Cant.</Text>
          <Text style={[{ width: COL.price }, s.num]}>Precio</Text>
          <Text style={[{ width: COL.amount }, s.num]}>Importe</Text>
        </View>
        {quote.lines.map((l) => {
          const info = (
            <>
              <View style={{ flex: COL.desc, paddingRight: 6 }}>
                <LineDescription text={l.description} />
                {(() => {
                  const t = measuresLine(l.widthMm, l.heightMm, l.drawing.kind !== "ninguno" ? frameColorLabel(l.drawing.frameColor) : "");
                  return t ? <Text style={s.muted}>{t}</Text> : null;
                })()}
              </View>
              <Text style={[{ width: COL.qty }, s.num]}>{qty(l.quantity)}</Text>
              <Text style={[{ width: COL.price }, s.num]}>{formatEuros(l.unitPriceCents)}</Text>
              <Text style={[{ width: COL.amount }, s.num, s.bold]}>{formatEuros(lineTotalCents(l.quantity, l.unitPriceCents))}</Text>
            </>
          );
          if (!large) {
            return (
              <View key={l.id} style={s.row} wrap={false}>
                <View style={{ width: COL.drawing, alignItems: "center", paddingRight: 6 }}>
                  <DrawingPdf params={l.drawing} widthMm={l.widthMm} heightMm={l.heightMm} size={105} />
                </View>
                {info}
              </View>
            );
          }
          // Dibujo grande: la información en una fila y el dibujo debajo, sin partirse entre páginas.
          const hasDrawing = l.drawing.kind !== "ninguno";
          return (
            <View key={l.id} wrap={false} style={{ borderBottom: "0.5pt solid #e2e8f0", paddingBottom: hasDrawing ? 12 : 0 }}>
              <View style={[s.row, { borderBottom: "none" }]}>{info}</View>
              {hasDrawing ? (
                <View style={{ alignItems: "center", paddingTop: 4 }}>
                  <DrawingPdf params={l.drawing} widthMm={l.widthMm} heightMm={l.heightMm} size={285} />
                </View>
              ) : null}
            </View>
          );
        })}

        <TotalsBlock totals={quote} vatRate={quote.vatRate} />

        {/* Las observaciones salen siempre del texto de Ajustes (no se editan en cada presupuesto). */}
        {fillQuoteNotes(company).trim() ? (
          <View style={s.notes} wrap={false}>
            <Text style={s.boxLabel}>Observaciones</Text>
            <Text>{fillQuoteNotes(company).trim()}</Text>
          </View>
        ) : null}

        {/* Firma y RGPD juntos, para que el texto legal no quede solo en una página. */}
        <View wrap={false}>
          <View style={{ flexDirection: "row", marginTop: 36, gap: 24 }}>
            <View style={{ flex: 1, borderTop: "0.5pt solid #94a3b8", paddingTop: 4 }}>
              <Text style={s.muted}>Conforme el cliente (firma y fecha)</Text>
            </View>
            <View style={{ flex: 1 }} />
          </View>
          <GdprText company={company} />
        </View>

        <Footer text={`${company.name} · Presupuesto ${quote.number}`} />
      </Page>
    </Document>
  );
}
