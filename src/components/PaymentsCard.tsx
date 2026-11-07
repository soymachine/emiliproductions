"use client";

import { Plus, Trash2, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import { addInvoicePayment, removeInvoicePayment } from "@/lib/db";
import { formatDate, todayIso } from "@/lib/dates";
import { centsToInput, formatEuros, parseEurosToCents } from "@/lib/money";
import { METHOD_LABELS, paidCentsOf, paymentsOf, pendingCentsOf } from "@/lib/payments";
import type { Invoice, PaymentMethod } from "@/lib/types";
import { Button, Card, CardTitle, ErrorBox, Field, Input, Select } from "./ui";

const METHOD_OPTIONS = (Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => ({ value: m, label: METHOD_LABELS[m] }));

/** Cobros de una factura: se puede cobrar en varias veces y por importes distintos. */
export function PaymentsCard({ invoice, onChange }: { invoice: Invoice; onChange: () => Promise<void> }) {
  const payments = paymentsOf(invoice);
  const paid = paidCentsOf(invoice);
  const pending = pendingCentsOf(invoice);
  const pct = invoice.totalCents > 0 ? Math.min(100, Math.round((paid / invoice.totalCents) * 100)) : 0;

  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState(centsToInput(pending));
  const [method, setMethod] = useState<PaymentMethod>("transferencia");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onChange();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const cents = parseEurosToCents(amount);
    if (cents === null || cents <= 0) return setError(new Error("Escribe un importe válido."));
    if (cents > pending) return setError(new Error(`El cobro no puede ser mayor que lo pendiente (${formatEuros(pending)}).`));
    await act(async () => {
      await addInvoicePayment(invoice.id, { date, amountCents: cents, method, note: note.trim() });
      const left = pending - cents;
      setAmount(left > 0 ? centsToInput(left) : "");
      setNote("");
    });
  }

  return (
    <Card>
      <CardTitle>Cobros</CardTitle>
      <dl className="tabular mb-3 grid grid-cols-2 gap-y-1">
        <dt className="text-muted-foreground">Cobrado</dt>
        <dd className="text-right font-semibold text-emerald-700">{formatEuros(paid)}</dd>
        <dt className="text-muted-foreground">Pendiente</dt>
        <dd className={`text-right font-semibold ${pending > 0 ? "text-amber-700" : ""}`}>{formatEuros(pending)}</dd>
      </dl>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Porcentaje cobrado">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ErrorBox error={error} />

      {payments.length ? (
        <ul className="mb-4 divide-y rounded-lg border">
          {payments.map((p) => (
            <li key={p.id} className="flex items-start gap-3 px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{formatEuros(p.amountCents)}</span>
                <span className="block text-sm text-muted-foreground">
                  {p.date ? formatDate(p.date) : "Sin fecha"} · {METHOD_LABELS[p.method] ?? p.method}
                  {p.note ? ` · ${p.note}` : ""}
                </span>
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (!confirm(`¿Borrar el cobro de ${formatEuros(p.amountCents)}?`)) return;
                  void act(() => removeInvoicePayment(invoice.id, p.id));
                }}
                className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-destructive"
                aria-label={`Borrar cobro de ${formatEuros(p.amountCents)}`}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">Aún no hay cobros registrados.</p>
      )}

      {pending > 0 ? (
        <form onSubmit={submit} className="flex flex-col gap-3 border-t pt-4">
          <p className="flex items-center gap-2 font-medium">
            <Wallet className="size-5 text-muted-foreground" />
            Registrar un cobro
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Importe (€)">
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
          </div>
          <Field label="Forma de pago">
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} options={METHOD_OPTIONS} />
          </Field>
          <Field label="Nota (opcional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej.: anticipo 50%" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy} className="flex-1">
              <Plus />
              Registrar cobro
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setAmount(centsToInput(pending))}>
              Todo lo pendiente
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Factura cobrada por completo.</p>
      )}
    </Card>
  );
}
