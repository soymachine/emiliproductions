"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Card, Empty, ErrorBox, Input, LinkButton, Loading, PageHeader, Select } from "@/components/ui";
import { listQuotes } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { normalizeText } from "@/lib/search";
import { useAsync } from "@/lib/useAsync";
import type { QuoteStatus } from "@/lib/types";

const STATUSES: QuoteStatus[] = ["borrador", "enviado", "aceptado", "rechazado", "facturado"];

export default function QuotesPage() {
  const { data, error, loading } = useAsync(listQuotes);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | QuoteStatus>("");
  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (x) =>
          (!status || x.status === status) &&
          (!q || normalizeText(`${x.number} ${x.client.name} ${x.client.city}`).includes(normalizeText(q))),
      ),
    [data, q, status],
  );

  return (
    <>
      <PageHeader title="Presupuestos" actions={<LinkButton href="/presupuestos/editar/">＋ Nuevo presupuesto</LinkButton>} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="🔍 Buscar por número o cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value as QuoteStatus | "")} className="sm:w-56">
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </Select>
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty>{data?.length ? "Ningún presupuesto coincide." : "Aún no hay presupuestos."}</Empty>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-slate-100">
            {filtered.map((x) => (
              <li key={x.id}>
                <Link href={`/presupuestos/editar/?id=${x.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-slate-50">
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
      )}
    </>
  );
}
