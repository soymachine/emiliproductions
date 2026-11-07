import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatDate } from "../dates";
import { formatEuros, lineTotalCents } from "../money";
import type { CompanySettings, Invoice } from "../types";
import { ClientBox, CompanyHeader, Footer, GdprText, LineDescription, measuresLine, qty, s, TotalsBlock } from "./common";

const COL = { desc: 1, qty: 45, price: 80, amount: 85 };

export function InvoicePdf({ invoice, company }: { invoice: Invoice; company: CompanySettings }) {
  return (
    <Document title={`Factura ${invoice.number}`} author={company.name}>
      <Page size="A4" style={s.page}>
        <CompanyHeader
          company={company}
          title="FACTURA"
          meta={[
            { label: "Nº", value: invoice.number },
            { label: "Fecha", value: formatDate(invoice.date) },
            { label: "Presupuesto", value: invoice.quoteNumber },
          ]}
        />
        <View style={s.boxes}>
          <ClientBox client={invoice.client} />
        </View>

        <View style={s.thead}>
          <Text style={{ flex: COL.desc }}>Descripción</Text>
          <Text style={[{ width: COL.qty }, s.num]}>Cant.</Text>
          <Text style={[{ width: COL.price }, s.num]}>Precio</Text>
          <Text style={[{ width: COL.amount }, s.num]}>Importe</Text>
        </View>
        {invoice.lines.map((l, i) => (
          <View key={i} style={s.row} wrap={false}>
            <View style={{ flex: COL.desc, paddingRight: 6 }}>
              <LineDescription text={l.description} />
              {measuresLine(l.widthMm, l.heightMm, l.color) ? <Text style={s.muted}>{measuresLine(l.widthMm, l.heightMm, l.color)}</Text> : null}
            </View>
            <Text style={[{ width: COL.qty }, s.num]}>{qty(l.quantity)}</Text>
            <Text style={[{ width: COL.price }, s.num]}>{formatEuros(l.unitPriceCents)}</Text>
            <Text style={[{ width: COL.amount }, s.num, s.bold]}>{formatEuros(lineTotalCents(l.quantity, l.unitPriceCents))}</Text>
          </View>
        ))}

        <TotalsBlock totals={invoice} vatRate={invoice.vatRate} />

        {invoice.vatRate === 10 ? (
          <Text style={[s.muted, { marginTop: 10, fontSize: 8 }]}>
            IVA reducido del 10% aplicado conforme al art. 91.Uno.2.10º de la Ley 37/1992 del IVA (obras de renovación y reparación en vivienda).
          </Text>
        ) : null}

        {invoice.notes ? (
          <View style={s.notes} wrap={false}>
            <Text style={s.boxLabel}>Observaciones</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}
        {company.invoiceFooter || company.iban ? (
          <View style={s.notes} wrap={false}>
            <Text style={s.boxLabel}>Forma de pago</Text>
            {company.invoiceFooter ? <Text>{company.invoiceFooter}</Text> : null}
            {company.iban ? <Text style={s.bold}>IBAN: {company.iban}</Text> : null}
          </View>
        ) : null}

        <GdprText company={company} />

        <Footer text={`${company.name} · NIF ${company.nif} · Factura ${invoice.number}`} />
      </Page>
    </Document>
  );
}
