"use client";

import Link from "next/link";
import { ArrowRight, FilePlus2, FileText, Receipt, UserPlus, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useCompany } from "@/components/CompanyContext";
import { Badge, Card, CardTitle, Loading } from "@/components/ui";
import { listInvoices, listQuotes } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { useAsync } from "@/lib/useAsync";

function greeting() {
  const h = new Date().getHours();
  return h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
}

function Stat({ href, icon, label, value, hint, tone }: { href: string; icon: ReactNode; label: string; value: string; hint: string; tone: string }) {
  return (
    <Link href={href} className="group last:col-span-2 lg:last:col-span-1">
      <Card className="h-full p-4 transition-shadow group-hover:shadow-md sm:p-6">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className={`flex size-9 items-center justify-center rounded-lg ${tone} [&_svg]:size-5`}>{icon}</span>
        </div>
        <p className="tabular mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </Card>
    </Link>
  );
}

function QuickAction({ href, icon, title, text }: { href: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border bg-card p-5 shadow-xs transition hover:border-primary/40 hover:shadow-md"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground [&_svg]:size-6">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
      <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

export default function Home() {
  const { company } = useCompany();
  const { data, loading } = useAsync(async () => {
    const [quotes, invoices] = await Promise.all([listQuotes(), listInvoices()]);
    return { quotes, invoices };
  });

  const year = String(new Date().getFullYear());
  const pending = data?.invoices.filter((i) => i.status === "pendiente") ?? [];
  const pendingTotal = pending.reduce((s, i) => s + i.totalCents, 0);
  const openQuotes = data?.quotes.filter((q) => q.status === "enviado" || q.status === "aceptado") ?? [];
  const billedYear = (data?.invoices ?? []).filter((i) => i.date.startsWith(year)).reduce((s, i) => s + i.subtotalCents, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}</h1>
        <p className="mt-1 text-muted-foreground">{company?.name ? `${company.name} · ` : ""}¿Qué quieres hacer hoy?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickAction href="/presupuestos/editar/" icon={<FilePlus2 />} title="Nuevo presupuesto" text="Elige cliente, añade ventanas y puertas" />
        <QuickAction href="/clientes/editar/" icon={<UserPlus />} title="Nuevo cliente" text="Da de alta un cliente" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Stat
          href="/facturas/"
          icon={<Wallet />}
          tone="bg-amber-50 text-amber-600"
          label="Pendiente de cobro"
          value={data ? formatEuros(pendingTotal) : "…"}
          hint={`${pending.length} ${pending.length === 1 ? "factura" : "facturas"}`}
        />
        <Stat
          href="/presupuestos/"
          icon={<FileText />}
          tone="bg-blue-50 text-blue-600"
          label="Presupuestos abiertos"
          value={data ? String(openQuotes.length) : "…"}
          hint="enviados o aceptados"
        />
        <Stat
          href="/facturas/"
          icon={<Receipt />}
          tone="bg-emerald-50 text-emerald-600"
          label={`Facturado en ${year}`}
          value={data ? formatEuros(billedYear) : "…"}
          hint="base imponible, sin IVA"
        />
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-0 sm:p-0">
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
              <CardTitle
                action={
                  <Link href="/presupuestos/" className="text-sm font-medium text-primary hover:underline">
                    Ver todos
                  </Link>
                }
              >
                Últimos presupuestos
              </CardTitle>
            </div>
            {data!.quotes.length === 0 ? <p className="px-6 pb-6 text-muted-foreground">Aún no hay presupuestos.</p> : null}
            <ul className="divide-y border-t">
              {data!.quotes.slice(0, 6).map((q) => (
                <li key={q.id}>
                  <Link href={`/presupuestos/editar/?id=${q.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/60 sm:px-6">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{q.client.name}</span>
                      <span className="block font-mono text-xs text-muted-foreground">{q.number}</span>
                    </span>
                    <span className="tabular hidden font-medium sm:inline">{formatEuros(q.totalCents)}</span>
                    <Badge status={q.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-0 sm:p-0">
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
              <CardTitle
                action={
                  <Link href="/facturas/" className="text-sm font-medium text-primary hover:underline">
                    Ver todas
                  </Link>
                }
              >
                Pendientes de cobro
              </CardTitle>
            </div>
            {pending.length === 0 ? <p className="px-6 pb-6 text-muted-foreground">No hay facturas pendientes.</p> : null}
            <ul className="divide-y border-t">
              {pending.slice(0, 6).map((i) => (
                <li key={i.id}>
                  <Link href={`/facturas/ver/?id=${i.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/60 sm:px-6">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{i.client.name}</span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {i.number} · {formatDate(i.date)}
                      </span>
                    </span>
                    <span className="tabular font-semibold">{formatEuros(i.totalCents)}</span>
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
