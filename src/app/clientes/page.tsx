"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, Empty, ErrorBox, Input, LinkButton, Loading, PageHeader } from "@/components/ui";
import { listClients } from "@/lib/db";
import { useAsync } from "@/lib/useAsync";
import { matchesClient } from "@/lib/search";

export default function ClientsPage() {
  const { data, error, loading } = useAsync(listClients);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => (data ?? []).filter((c) => matchesClient(c, q)), [data, q]);

  return (
    <>
      <PageHeader
        title="Clientes"
        actions={
          <>
            <LinkButton href="/clientes/importar/" variant="secondary">
              Importar
            </LinkButton>
            <LinkButton href="/clientes/editar/">＋ Nuevo cliente</LinkButton>
          </>
        }
      />
      <Input placeholder="🔍 Buscar por nombre, NIF, población, teléfono…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4" />
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty>{data?.length ? "Ningún cliente coincide con la búsqueda." : "Aún no hay clientes. Crea uno o impórtalos desde InGnio."}</Empty>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link href={`/clientes/editar/?id=${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-slate-50">
                  <span className="min-w-0 flex-1 font-semibold">
                    {c.name}
                    {c.kind === "empresa" ? <span className="ml-2 text-xs font-normal text-slate-500">Empresa</span> : null}
                  </span>
                  <span className="w-32 text-slate-500">{c.nif}</span>
                  <span className="w-40 text-slate-500">{c.city}</span>
                  <span className="w-36 text-slate-500">{c.phone}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <p className="mt-3 text-sm text-slate-500">{data ? `${filtered.length} de ${data.length} clientes` : ""}</p>
    </>
  );
}
