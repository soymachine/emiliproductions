"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Badge, Button, Card, ErrorBox, Field, Input, Loading, PageHeader } from "@/components/ui";
import { getInvoice, getSettings, setInvoicePaid } from "@/lib/db";
import { formatDate, todayIso } from "@/lib/dates";
import { formatEuros, lineTotalCents } from "@/lib/money";
import { downloadInvoicePdf } from "@/lib/pdf/download";
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
  const { data, error, loading, reload } = useAsync(async () => {
    const [invoice, settings] = await Promise.all([getInvoice(id), getSettings()]);
    return { invoice, settings };
  }, [id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  const [paidDate, setPaidDate] = useState(todayIso());

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
                <p className="text-sm font-semibold text-slate-500">Cliente</p>
                <p className="text-lg font-bold">{inv.client.name}</p>
                <p className="text-slate-600">{inv.client.nif}</p>
                <p className="text-slate-600">
                  {inv.client.address} {inv.client.postalCode} {inv.client.city}
                </p>
              </div>
              <div className="sm:text-right">
                <p>
                  <span className="text-slate-500">Fecha:</span> <strong>{formatDate(inv.date)}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Presupuesto:</span>{" "}
                  <Link className="font-semibold text-brand-600 underline" href={`/presupuestos/editar/?id=${inv.quoteId}`}>
                    {inv.quoteNumber}
                  </Link>
                </p>
                {inv.paidAt ? (
                  <p>
                    <span className="text-slate-500">Pagada el:</span> <strong>{formatDate(inv.paidAt)}</strong>
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="p-3">Descripción</th>
                  <th className="p-3 text-right">Cant.</th>
                  <th className="p-3 text-right">Precio</th>
                  <th className="p-3 text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {inv.lines.map((l, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-3">
                      <p className="font-semibold">{l.description}</p>
                      {l.widthMm && l.heightMm ? <p className="text-sm text-slate-500">{l.widthMm} × {l.heightMm} mm</p> : null}
                    </td>
                    <td className="p-3 text-right">{l.quantity}</td>
                    <td className="p-3 text-right">{formatEuros(l.unitPriceCents)}</td>
                    <td className="p-3 text-right font-semibold">{formatEuros(lineTotalCents(l.quantity, l.unitPriceCents))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        <aside className="flex flex-col gap-4">
          <Card>
            <dl className="flex flex-col gap-1">
              <div className="flex justify-between">
                <dt className="text-slate-600">Base imponible</dt>
                <dd>{formatEuros(inv.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">IVA {inv.vatRate}%</dt>
                <dd>{formatEuros(inv.vatCents)}</dd>
              </div>
              <div className="flex justify-between text-2xl font-bold text-brand-700">
                <dt>Total</dt>
                <dd>{formatEuros(inv.totalCents)}</dd>
              </div>
            </dl>
          </Card>
          <Button onClick={() => act(() => downloadInvoicePdf(inv, data!.settings))} disabled={busy}>
            📄 Descargar PDF
          </Button>
          {inv.status === "pendiente" ? (
            <Card className="flex flex-col gap-3">
              <Field label="Fecha de cobro">
                <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
              </Field>
              <Button variant="secondary" disabled={busy} onClick={() => act(async () => { await setInvoicePaid(inv.id, paidDate); await reload(); })}>
                ✓ Marcar como pagada
              </Button>
            </Card>
          ) : (
            <Button variant="ghost" disabled={busy} onClick={() => act(async () => { await setInvoicePaid(inv.id, null); await reload(); })}>
              Marcar como pendiente
            </Button>
          )}
        </aside>
      </div>
    </>
  );
}
