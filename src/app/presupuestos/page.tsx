"use client";

import { FileText, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Empty, ErrorBox, Input, LinkButton, ListCard, ListRow, Loading, PageHeader, Select } from "@/components/ui";
import { listQuotes } from "@/lib/db";
import { useIsViewer } from "@/components/AuthGate";
import { formatDate } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { normalizeText } from "@/lib/search";
import { useAsync } from "@/lib/useAsync";

type Filter = "todos" | "sin-facturar" | "facturados";

const FILTER_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "sin-facturar", label: "Sin facturar" },
  { value: "facturados", label: "Facturados" },
];

export default function QuotesPage() {
  const viewer = useIsViewer();
  const { data, error, loading } = useAsync(listQuotes);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Filter>("todos");
  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (x) =>
          (status === "todos" || (status === "facturados") === Boolean(x.invoiceId)) &&
          (!q || normalizeText(`${x.number} ${x.client.name} ${x.client.city}`).includes(normalizeText(q))),
      ),
    [data, q, status],
  );

  return (
    <>
      <PageHeader
        title="Presupuestos"
        description={data ? `${data.length} presupuestos` : undefined}
        actions={
          viewer ? null : (
            <LinkButton href="/presupuestos/editar/">
              <Plus />
              Nuevo presupuesto
            </LinkButton>
          )
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por número o cliente…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-12" />
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as Filter)}
          options={FILTER_OPTIONS}
          className="sm:w-56"
          aria-label="Filtrar"
        />
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty icon={<FileText />}>{data?.length ? "Ningún presupuesto coincide." : "Aún no hay presupuestos."}</Empty>
      ) : (
        <ListCard>
          {filtered.map((x) => (
            <ListRow key={x.id} href={`/presupuestos/editar/?id=${x.id}`}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{x.client.name}</span>
                <span className="block text-sm text-muted-foreground">
                  <span className="font-mono">{x.number}</span> · {formatDate(x.date)}
                </span>
              </span>
              <span className="tabular text-right font-semibold">{formatEuros(x.totalCents)}</span>
              <span className="w-32 text-right">
                <Badge status={x.invoiceId ? "facturado" : "sin facturar"} />
              </span>
            </ListRow>
          ))}
        </ListCard>
      )}
    </>
  );
}
