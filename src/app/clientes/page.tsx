"use client";

import { Building2, Mail, MapPin, Phone, Plus, Search, Upload, User, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Empty, ErrorBox, Input, LinkButton, ListCard, ListRow, Loading, PageHeader } from "@/components/ui";
import { listClients } from "@/lib/db";
import { matchesClient } from "@/lib/search";
import { useAsync } from "@/lib/useAsync";

export default function ClientsPage() {
  const { data, error, loading } = useAsync(listClients);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => (data ?? []).filter((c) => matchesClient(c, q)), [data, q]);

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
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, NIF, población, teléfono…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-12" />
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
                <span className="block truncate font-medium">{c.name}</span>
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
