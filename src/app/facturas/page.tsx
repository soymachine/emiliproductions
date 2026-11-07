"use client";

import { CalendarRange, Receipt, Search } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Card, Empty, ErrorBox, Field, Input, Loading, PageHeader, Select } from "@/components/ui";
import { listInvoices } from "@/lib/db";
import { formatDate, rangePreset, type RangePreset } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { paidCentsOf, pendingCentsOf } from "@/lib/payments";
import { normalizeText } from "@/lib/search";
import { useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

type StatusFilter = "todas" | "pendientes" | "parcial" | "pagada";

const PRESETS: { key: RangePreset | "todo"; label: string }[] = [
  { key: "mes", label: "Este mes" },
  { key: "trimestre", label: "Este trimestre" },
  { key: "año", label: "Este año" },
  { key: "año-pasado", label: "Año pasado" },
  { key: "todo", label: "Todo" },
];

function statusOf(i: Invoice): "pendiente" | "parcial" | "pagada" {
  const paid = paidCentsOf(i);
  return paid <= 0 ? "pendiente" : paid >= i.totalCents ? "pagada" : "parcial";
}

export default function InvoicesPage() {
  const router = useRouter();
  const { data, error, loading } = useAsync(listInvoices);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("todas");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const activePreset = useMemo(() => {
    if (!from && !to) return "todo";
    return (PRESETS.find((p) => p.key !== "todo" && rangePreset(p.key).from === from && rangePreset(p.key).to === to)?.key ?? null) as string | null;
  }, [from, to]);

  const filtered = useMemo(
    () =>
      (data ?? []).filter((x) => {
        const st = statusOf(x);
        if (status === "pendientes" && st === "pagada") return false;
        if (status === "parcial" && st !== "parcial") return false;
        if (status === "pagada" && st !== "pagada") return false;
        if (from && x.date < from) return false;
        if (to && x.date > to) return false;
        return !q || normalizeText(`${x.number} ${x.client.name} ${x.client.nif}`).includes(normalizeText(q));
      }),
    [data, q, status, from, to],
  );

  const sum = filtered.reduce(
    (acc, i) => ({
      base: acc.base + i.subtotalCents,
      vat: acc.vat + i.vatCents,
      total: acc.total + i.totalCents,
      paid: acc.paid + paidCentsOf(i),
      pending: acc.pending + pendingCentsOf(i),
    }),
    { base: 0, vat: 0, total: 0, paid: 0, pending: 0 },
  );

  return (
    <>
      <PageHeader title="Facturas" description="Se crean desde un presupuesto con «Convertir en factura»." />

      <Card className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por número, cliente o NIF…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-12" />
          </div>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as StatusFilter)}
            options={[
              { value: "todas", label: "Todas" },
              { value: "pendientes", label: "Pendientes de cobro" },
              { value: "parcial", label: "Cobro parcial" },
              { value: "pagada", label: "Pagadas" },
            ]}
            className="sm:w-56"
            aria-label="Filtrar por cobro"
          />
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid flex-1 grid-cols-2 gap-3 lg:max-w-md">
            <Field label="Desde">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Hasta">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarRange className="hidden size-5 text-muted-foreground lg:block" />
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  if (p.key === "todo") {
                    setFrom("");
                    setTo("");
                  } else {
                    const r = rangePreset(p.key);
                    setFrom(r.from);
                    setTo(r.to);
                  }
                }}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-sm font-medium transition",
                  activePreset === p.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty icon={<Receipt />}>{data?.length ? "Ninguna factura coincide con el filtro." : "Aún no hay facturas."}</Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
            <table className="tabular w-full min-w-[760px] text-left">
              <thead className="border-b bg-muted/60 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Nº factura</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 text-right font-medium">Base imponible</th>
                  <th className="px-4 py-3 text-right font-medium">IVA</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((x) => {
                  const st = statusOf(x);
                  const href = `/facturas/ver/?id=${x.id}`;
                  return (
                    <tr key={x.id} onClick={() => router.push(href)} className="cursor-pointer transition-colors hover:bg-muted/60">
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(x.date)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link href={href} className="font-mono text-sm font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                          {x.number}
                        </Link>
                      </td>
                      <td className="max-w-[16rem] truncate px-4 py-3 font-medium">{x.client.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{formatEuros(x.subtotalCents)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                        {formatEuros(x.vatCents)} <span className="text-xs">({x.vatRate}%)</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{formatEuros(x.totalCents)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Badge status={st} />
                        {st === "parcial" ? <span className="block text-xs text-amber-700">Pendiente {formatEuros(pendingCentsOf(x))}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Card className="tabular mt-4 grid grid-cols-2 gap-4 py-4 text-center sm:grid-cols-5 sm:py-4">
            <div>
              <p className="text-sm text-muted-foreground">Base</p>
              <p className="font-semibold">{formatEuros(sum.base)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IVA</p>
              <p className="font-semibold">{formatEuros(sum.vat)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-bold text-primary">{formatEuros(sum.total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cobrado</p>
              <p className="font-semibold text-emerald-700">{formatEuros(sum.paid)}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-sm text-muted-foreground">Pendiente</p>
              <p className="font-semibold text-amber-700">{formatEuros(sum.pending)}</p>
            </div>
          </Card>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "factura" : "facturas"}
            {from || to ? ` del ${from ? formatDate(from) : "inicio"} al ${to ? formatDate(to) : "hoy"}` : ""}
          </p>
        </>
      )}
    </>
  );
}
