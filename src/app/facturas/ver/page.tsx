"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { Suspense, useState } from "react";
import { Badge, Button, Card, ErrorBox, Loading, PageHeader } from "@/components/ui";
import { PaymentsCard } from "@/components/PaymentsCard";
import { AnnotationsCard } from "@/components/AnnotationsCard";
import { useIsViewer } from "@/components/AuthGate";
import { getInvoice, getSettings } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatEuros, lineTotalCents } from "@/lib/money";
import { buildInvoicePdf, type BuiltPdf } from "@/lib/pdf/download";
import { PdfPreview } from "@/components/PdfPreview";
import { useAsync } from "@/lib/useAsync";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <InvoiceView />
    </Suspense>
  );
}

function InvoiceView() {
  const id = useSearchParams().get("id") ?? "";
  const viewer = useIsViewer();
  const { data, error, loading, reload } = useAsync(async () => {
    const [invoice, settings] = await Promise.all([getInvoice(id), getSettings()]);
    return { invoice, settings };
  }, [id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  const [preview, setPreview] = useState<BuiltPdf | null>(null);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const inv = data?.invoice;
  if (!inv) return <ErrorBox error="Factura no encontrada." />;

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title={`Factura ${inv.number}`} back={{ href: "/facturas/", label: "Facturas" }} actions={<Badge status={inv.status} />} />
      <ErrorBox error={actionError} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                <p className="text-lg font-semibold">{inv.client.name}</p>
                <p className="text-muted-foreground">{inv.client.nif}</p>
                <p className="text-muted-foreground">
                  {inv.client.address} {inv.client.postalCode} {inv.client.city}
                </p>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 self-start sm:justify-self-end">
                <dt className="text-muted-foreground">Fecha</dt>
                <dd className="font-medium">{formatDate(inv.date)}</dd>
                <dt className="text-muted-foreground">Presupuesto</dt>
                <dd>
                  <Link className="font-medium text-primary hover:underline" href={`/presupuestos/editar/?id=${inv.quoteId}`}>
                    {inv.quoteNumber}
                  </Link>
                </dd>
                {inv.paidAt ? (
                  <>
                    <dt className="text-muted-foreground">Cobrada el</dt>
                    <dd className="font-medium text-emerald-700">{formatDate(inv.paidAt)}</dd>
                  </>
                ) : null}
              </dl>
            </div>
          </Card>
          <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
            <table className="tabular w-full text-left">
              <thead className="border-b bg-muted/60 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="px-4 py-3 text-right font-medium">Cant.</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inv.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <p className="whitespace-pre-line font-medium">{l.description}</p>
                      {(l.widthMm && l.heightMm) || l.color || l.measuresText ? (
                        <p className="text-sm text-muted-foreground">
                          {[l.measuresText ?? (l.widthMm && l.heightMm ? `${l.widthMm} × ${l.heightMm} mm` : ""), l.color ? `Color: ${l.color}` : ""].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">{l.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatEuros(l.unitPriceCents)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatEuros(lineTotalCents(l.quantity, l.unitPriceCents))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
          <Card>
            <dl className="tabular flex flex-col gap-1.5">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Base imponible</dt>
                <dd>{formatEuros(inv.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">IVA {inv.vatRate}%</dt>
                <dd>{formatEuros(inv.vatCents)}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t pt-2 text-2xl font-bold text-primary">
                <dt>Total</dt>
                <dd>{formatEuros(inv.totalCents)}</dd>
              </div>
            </dl>
          </Card>
          <Button onClick={() => act(async () => setPreview(await buildInvoicePdf(inv, data!.settings)))} disabled={busy}>
            <FileText />
            {busy ? "Generando…" : "Ver PDF"}
          </Button>
          <PaymentsCard invoice={inv} onChange={reload} readOnly={viewer} />
          <AnnotationsCard invoice={inv} readOnly={viewer} />
        </aside>
      </div>
      {preview ? <PdfPreview pdf={preview} onClose={() => setPreview(null)} /> : null}
    </>
  );
}
