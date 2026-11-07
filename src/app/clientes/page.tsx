"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Plus, Search, Upload, User, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Empty, ErrorBox, Input, LinkButton, Loading, PageHeader, Select } from "@/components/ui";
import { listClients } from "@/lib/db";
import { matchesClient } from "@/lib/search";
import { useAsync } from "@/lib/useAsync";

export default function ClientsPage() {
  const router = useRouter();
  const { data, error, loading } = useAsync(listClients);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "code">("name");
  const filtered = useMemo(() => {
    const list = (data ?? []).filter((c) => matchesClient(c, q));
    if (sort === "code") {
      // Orden natural: 2 antes que 10; los que no tienen código, al final.
      list.sort((a, b) => {
        if (!a.code) return b.code ? 1 : 0;
        if (!b.code) return -1;
        return a.code.localeCompare(b.code, "es", { numeric: true });
      });
    }
    return list;
  }, [data, q, sort]);

  return (
    <>
      <PageHeader
        title="Clientes"
        description={data ? `${data.length} clientes` : undefined}
        actions={
          <>
            <LinkButton href="/clientes/importar/" variant="secondary">
              <Upload />
              Importar
            </LinkButton>
            <LinkButton href="/clientes/editar/">
              <Plus />
              Nuevo cliente
            </LinkButton>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por código, nombre, NIF, población, teléfono…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-12" />
        </div>
        <Select
          value={sort}
          onValueChange={(v) => setSort(v as "name" | "code")}
          options={[
            { value: "name", label: "Ordenar por nombre" },
            { value: "code", label: "Ordenar por código" },
          ]}
          className="sm:w-60"
          aria-label="Ordenar"
        />
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty icon={<Users />}>{data?.length ? "Ningún cliente coincide con la búsqueda." : "Aún no hay clientes. Crea uno o impórtalos desde InGnio."}</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b bg-muted/60 text-sm text-muted-foreground">
              <tr>
                <th className="w-24 px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">NIF</th>
                <th className="px-4 py-3 font-medium">Población</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => {
                const href = `/clientes/editar/?id=${c.id}`;
                return (
                  <tr key={c.id} onClick={() => router.push(href)} className="cursor-pointer transition-colors hover:bg-muted/60">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-muted-foreground">{c.code}</td>
                    <td className="max-w-[18rem] px-4 py-3">
                      <Link href={href} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 font-medium hover:text-primary">
                        {c.kind === "empresa" ? (
                          <Building2 className="size-4 shrink-0 text-muted-foreground" aria-label="Empresa" />
                        ) : (
                          <User className="size-4 shrink-0 text-muted-foreground" aria-label="Particular" />
                        )}
                        <span className="truncate">{c.name}</span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{c.nif}</td>
                    <td className="max-w-[10rem] truncate px-4 py-3">{c.city}</td>
                    <td className="whitespace-nowrap px-4 py-3">{c.phone}</td>
                    <td className="max-w-[14rem] truncate px-4 py-3 text-muted-foreground">{c.email}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {data && q ? <p className="mt-3 text-sm text-muted-foreground">{`${filtered.length} de ${data.length} clientes`}</p> : null}
    </>
  );
}
