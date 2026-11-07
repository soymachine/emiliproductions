import { Document, Page, Text, View } from "@react-pdf/renderer";
import { DrawingPdf } from "../drawings/DrawingPdf";
import { formatDate } from "../dates";
import { formatEuros, lineTotalCents } from "../money";
import type { CompanySettings, Quote } from "../types";
import { ClientBox, CompanyHeader, Footer, measures, qty, s, TotalsBlock } from "./common";

const COL = { drawing: 115, desc: 1, qty: 40, price: 70, amount: 75 };

export function QuotePdf({ quote, company }: { quote: Quote; company: CompanySettings }) {
  return (
    <Document title={`Presupuesto ${quote.number}`} author={company.name}>
      <Page size="A4" style={s.page}>
        <CompanyHeader
          company={company}
          title="PRESUPUESTO"
          meta={[
            { label: "Nº", value: quote.number },
            { label: "Fecha", value: formatDate(quote.date) },
            { label: "Válido hasta", value: formatDate(quote.validUntil) },
          ]}
        />
        <View style={s.boxes}>
          <ClientBox client={quote.client} />
        </View>

        <View style={s.thead} fixed>
          <Text style={{ width: COL.drawing }}>Dibujo</Text>
          <Text style={{ flex: COL.desc }}>Descripción</Text>
          <Text style={[{ width: COL.qty }, s.num]}>Cant.</Text>
          <Text style={[{ width: COL.price }, s.num]}>Precio</Text>
          <Text style={[{ width: COL.amount }, s.num]}>Importe</Text>
        </View>
        {quote.lines.map((l) => (
          <View key={l.id} style={s.row} wrap={false}>
            <View style={{ width: COL.drawing, alignItems: "center", paddingRight: 6 }}>
              <DrawingPdf params={l.drawing} widthMm={l.widthMm} heightMm={l.heightMm} size={105} />
            </View>
            <View style={{ flex: COL.desc, paddingRight: 6 }}>
              <Text style={s.bold}>{l.description}</Text>
              {measures(l.widthMm, l.heightMm) ? <Text style={s.muted}>Medidas: {measures(l.widthMm, l.heightMm)}</Text> : null}
            </View>
            <Text style={[{ width: COL.qty }, s.num]}>{qty(l.quantity)}</Text>
            <Text style={[{ width: COL.price }, s.num]}>{formatEuros(l.unitPriceCents)}</Text>
            <Text style={[{ width: COL.amount }, s.num, s.bold]}>{formatEuros(lineTotalCents(l.quantity, l.unitPriceCents))}</Text>
          </View>
        ))}

        <TotalsBlock totals={quote} vatRate={quote.vatRate} />

        {quote.notes ? (
          <View style={s.notes} wrap={false}>
            <Text style={s.boxLabel}>Observaciones</Text>
            <Text>{quote.notes}</Text>
          </View>
        ) : null}
        {company.quoteConditions ? (
          <View style={s.notes} wrap={false}>
            <Text style={s.boxLabel}>Condiciones</Text>
            <Text>{company.quoteConditions}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", marginTop: 36, gap: 24 }} wrap={false}>
          <View style={{ flex: 1, borderTop: "0.5pt solid #94a3b8", paddingTop: 4 }}>
            <Text style={s.muted}>Conforme el cliente (firma y fecha)</Text>
          </View>
          <View style={{ flex: 1 }} />
        </View>

        <Footer text={`${company.name} · Presupuesto ${quote.number}`} />
      </Page>
    </Document>
  );
}
