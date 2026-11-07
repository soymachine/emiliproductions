"use client";

import Link from "next/link";
import { Badge, Card, LinkButton, Loading } from "@/components/ui";
import { listInvoices, listQuotes } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { useAsync } from "@/lib/useAsync";

export default function Home() {
  const { data, loading } = useAsync(async () => {
    const [quotes, invoices] = await Promise.all([listQuotes(), listInvoices()]);
    return { quotes, invoices };
  });

  const pending = data?.invoices.filter((i) => i.status === "pendiente") ?? [];
  const pendingTotal = pending.reduce((s, i) => s + i.totalCents, 0);
  const openQuotes = data?.quotes.filter((q) => q.status === "enviado" || q.status === "aceptado") ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LinkButton href="/presupuestos/editar/" className="min-h-24 text-xl">
          ＋ Nuevo presupuesto
        </LinkButton>
        <LinkButton href="/clientes/editar/" variant="secondary" className="min-h-24 text-xl">
          ＋ Nuevo cliente
        </LinkButton>
        <Link href="/facturas/" className="block">
          <Card className="h-full">
            <p className="text-sm font-semibold text-slate-500">Pendiente de cobro</p>
            <p className="text-2xl font-bold text-amber-700">{formatEuros(pendingTotal)}</p>
            <p className="text-sm text-slate-500">{pending.length} facturas</p>
          </Card>
        </Link>
        <Link href="/presupuestos/" className="block">
          <Card className="h-full">
            <p className="text-sm font-semibold text-slate-500">Presupuestos abiertos</p>
            <p className="text-2xl font-bold text-brand-700">{openQuotes.length}</p>
            <p className="text-sm text-slate-500">enviados o aceptados</p>
          </Card>
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-xl font-bold">Últimos presupuestos</h2>
            {data!.quotes.length === 0 ? <p className="text-slate-500">Aún no hay presupuestos.</p> : null}
            <ul className="divide-y divide-slate-100">
              {data!.quotes.slice(0, 6).map((q) => (
                <li key={q.id}>
                  <Link href={`/presupuestos/editar/?id=${q.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50">
                    <span className="w-28 shrink-0 font-mono text-sm text-slate-500">{q.number}</span>
                    <span className="flex-1 truncate font-semibold">{q.client.name}</span>
                    <span className="hidden sm:inline">{formatEuros(q.totalCents)}</span>
                    <Badge status={q.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-3 text-xl font-bold">Facturas pendientes de cobro</h2>
            {pending.length === 0 ? <p className="text-slate-500">No hay facturas pendientes. 👍</p> : null}
            <ul className="divide-y divide-slate-100">
              {pending.slice(0, 6).map((i) => (
                <li key={i.id}>
                  <Link href={`/facturas/ver/?id=${i.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50">
                    <span className="w-28 shrink-0 font-mono text-sm text-slate-500">{i.number}</span>
                    <span className="flex-1 truncate font-semibold">{i.client.name}</span>
                    <span className="text-sm text-slate-500">{formatDate(i.date)}</span>
                    <span className="font-semibold">{formatEuros(i.totalCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
