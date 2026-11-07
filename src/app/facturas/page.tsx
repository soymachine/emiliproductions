"use client";

import { Receipt, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Card, Empty, ErrorBox, Input, ListCard, ListRow, Loading, PageHeader, Select } from "@/components/ui";
import { listInvoices } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { normalizeText } from "@/lib/search";
import { useAsync } from "@/lib/useAsync";
import type { InvoiceStatus } from "@/lib/types";

export default function InvoicesPage() {
  const { data, error, loading } = useAsync(listInvoices);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"todas" | InvoiceStatus>("todas");
  const [year, setYear] = useState("todos");
  const years = useMemo(() => [...new Set((data ?? []).map((i) => i.date.slice(0, 4)))].sort().reverse(), [data]);
  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (x) =>
          (status === "todas" || x.status === status) &&
          (year === "todos" || x.date.startsWith(year)) &&
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
      <PageHeader title="Facturas" description="Se crean desde un presupuesto con «Convertir en factura»." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por número, cliente o NIF…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-12" />
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as InvoiceStatus | "todas")}
          options={[
            { value: "todas", label: "Todas" },
            { value: "pendiente", label: "Pendientes" },
            { value: "pagada", label: "Pagadas" },
          ]}
          className="sm:w-44"
          aria-label="Filtrar por estado"
        />
        <Select
          value={year}
          onValueChange={setYear}
          options={[{ value: "todos", label: "Todos los años" }, ...years.map((y) => ({ value: y, label: y }))]}
          className="sm:w-44"
          aria-label="Filtrar por año"
        />
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty icon={<Receipt />}>{data?.length ? "Ninguna factura coincide." : "Aún no hay facturas."}</Empty>
      ) : (
        <>
          <ListCard>
            {filtered.map((x) => (
              <ListRow key={x.id} href={`/facturas/ver/?id=${x.id}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{x.client.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    <span className="font-mono">{x.number}</span> · {formatDate(x.date)}
                  </span>
                </span>
                <span className="tabular text-right font-semibold">{formatEuros(x.totalCents)}</span>
                <span className="w-28 text-right">
                  <Badge status={x.status} />
                </span>
              </ListRow>
            ))}
          </ListCard>
          <Card className="mt-4 grid grid-cols-3 gap-4 py-4 text-center sm:py-4">
            <div>
              <p className="text-sm text-muted-foreground">Base</p>
              <p className="tabular font-semibold">{formatEuros(sum.base)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IVA</p>
              <p className="tabular font-semibold">{formatEuros(sum.vat)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="tabular font-bold text-primary">{formatEuros(sum.total)}</p>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
