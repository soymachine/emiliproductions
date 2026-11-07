"use client";

import { Building2, Mail, MapPin, Phone, Plus, Search, Upload, User, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Empty, ErrorBox, Input, LinkButton, ListCard, ListRow, Loading, PageHeader, Select } from "@/components/ui";
import { listClients } from "@/lib/db";
import { matchesClient } from "@/lib/search";
import { useAsync } from "@/lib/useAsync";

export default function ClientsPage() {
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
        <ListCard>
          {filtered.map((c) => (
            <ListRow key={c.id} href={`/clientes/editar/?id=${c.id}`}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-slate-500">
                {c.kind === "empresa" ? <Building2 className="size-5" /> : <User className="size-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  {c.code ? <span className="shrink-0 rounded bg-muted px-1.5 font-mono text-sm text-muted-foreground">{c.code}</span> : null}
                  <span className="truncate font-medium">{c.name}</span>
                </span>
                <span className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                  {c.nif ? <span>{c.nif}</span> : null}
                  {c.city ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {c.city}
                    </span>
                  ) : null}
                  {c.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3.5" />
                      {c.phone}
                    </span>
                  ) : null}
                  {c.email ? (
                    <span className="hidden items-center gap-1 lg:inline-flex">
                      <Mail className="size-3.5" />
                      {c.email}
                    </span>
                  ) : null}
                </span>
              </span>
            </ListRow>
          ))}
        </ListCard>
      )}
      {data && q ? <p className="mt-3 text-sm text-muted-foreground">{`${filtered.length} de ${data.length} clientes`}</p> : null}
    </>
  );
}
