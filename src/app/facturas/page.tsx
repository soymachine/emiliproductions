"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Card, Empty, ErrorBox, Input, Loading, PageHeader, Select } from "@/components/ui";
import { listInvoices } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { normalizeText } from "@/lib/search";
import { useAsync } from "@/lib/useAsync";
import type { InvoiceStatus } from "@/lib/types";

export default function InvoicesPage() {
  const { data, error, loading } = useAsync(listInvoices);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | InvoiceStatus>("");
  const [year, setYear] = useState("");
  const years = useMemo(() => [...new Set((data ?? []).map((i) => i.date.slice(0, 4)))].sort().reverse(), [data]);
  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (x) =>
          (!status || x.status === status) &&
          (!year || x.date.startsWith(year)) &&
          (!q || normalizeText(`${x.number} ${x.client.name} ${x.client.nif}`).includes(normalizeText(q))),
      ),
    [data, q, status, year],
  );
  const sum = filtered.reduce(
    (acc, i) => ({ base: acc.base + i.subtotalCents, vat: acc.vat + i.vatCents, total: acc.total + i.totalCents }),
    { base: 0, vat: 0, total: 0 },
  );

  return (
    <>
      <PageHeader title="Facturas" />
      <p className="mb-4 text-slate-600">Las facturas se crean desde un presupuesto con el botón «Convertir en factura».</p>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="🔍 Buscar por número, cliente o NIF…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus | "")} className="sm:w-48">
          <option value="">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="pagada">Pagadas</option>
        </Select>
        <Select value={year} onChange={(e) => setYear(e.target.value)} className="sm:w-36">
          <option value="">Todos los años</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty>{data?.length ? "Ninguna factura coincide." : "Aún no hay facturas."}</Empty>
      ) : (
        <>
          <Card className="p-0">
            <ul className="divide-y divide-slate-100">
              {filtered.map((x) => (
                <li key={x.id}>
                  <Link href={`/facturas/ver/?id=${x.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-slate-50">
                    <span className="w-28 font-mono text-sm text-slate-500">{x.number}</span>
                    <span className="min-w-0 flex-1 font-semibold">{x.client.name}</span>
                    <span className="w-28 text-slate-500">{formatDate(x.date)}</span>
                    <span className="w-32 text-right font-semibold">{formatEuros(x.totalCents)}</span>
                    <span className="w-28 text-right">
                      <Badge status={x.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <div className="mt-4 flex flex-wrap justify-end gap-6 text-slate-700">
            <span>Base: <strong>{formatEuros(sum.base)}</strong></span>
            <span>IVA: <strong>{formatEuros(sum.vat)}</strong></span>
            <span>Total: <strong>{formatEuros(sum.total)}</strong></span>
          </div>
        </>
      )}
    </>
  );
}
