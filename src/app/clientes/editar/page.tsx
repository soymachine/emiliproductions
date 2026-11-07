"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FilePlus2, Trash2 } from "lucide-react";
import { Suspense, useState } from "react";
import { ClientForm, EMPTY_CLIENT } from "@/components/ClientForm";
import { Badge, Button, Card, CardTitle, ErrorBox, LinkButton, Loading, Notice, PageHeader } from "@/components/ui";
import { deleteClient, getClient, listDocsByClient, saveClient } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { useAsync } from "@/lib/useAsync";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <EditClient />
    </Suspense>
  );
}

function EditClient() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const { data, loading } = useAsync(async () => {
    if (!id) return null;
    const [client, docs] = await Promise.all([getClient(id), listDocsByClient(id)]);
    return { client, docs };
  }, [id]);

  if (loading) return <Loading />;
  const client = data?.client;
  if (id && !client) return <ErrorBox error="Cliente no encontrado." />;

  return (
    <>
      <PageHeader
        title={client ? client.name : "Nuevo cliente"}
        back={{ href: "/clientes/", label: "Clientes" }}
        actions={
          client ? (
            <LinkButton href={`/presupuestos/editar/?cliente=${client.id}`}>
              <FilePlus2 />
              Nuevo presupuesto
            </LinkButton>
          ) : null
        }
      />
      <ErrorBox error={error} />
      {saved ? <Notice>Cliente guardado.</Notice> : null}
      <Card>
        <ClientForm
          key={client?.id ?? "new"}
          initial={client ?? EMPTY_CLIENT}
          onSubmit={async (c) => {
            setError(null);
            try {
              const newId = await saveClient({ ...c, id: client?.id, createdAt: client?.createdAt });
              setSaved(true);
              if (!client) router.replace(`/clientes/editar/?id=${newId}`);
            } catch (e) {
              setError(e);
            }
          }}
        />
      </Card>

      {client && data ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="pb-0 sm:pb-0">
            <CardTitle>Presupuestos</CardTitle>
            {data.docs.quotes.length === 0 ? <p className="text-muted-foreground">Sin presupuestos.</p> : null}
            <ul className="-mx-5 divide-y border-t sm:-mx-6">
              {data.docs.quotes.map((q) => (
                <li key={q.id}>
                  <Link href={`/presupuestos/editar/?id=${q.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/60 sm:px-6">
                    <span className="font-mono text-sm">{q.number}</span>
                    <span className="flex-1 text-muted-foreground">{formatDate(q.date)}</span>
                    <span className="tabular">{formatEuros(q.totalCents)}</span>
                    <Badge status={q.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="pb-0 sm:pb-0">
            <CardTitle>Facturas</CardTitle>
            {data.docs.invoices.length === 0 ? <p className="text-muted-foreground">Sin facturas.</p> : null}
            <ul className="-mx-5 divide-y border-t sm:-mx-6">
              {data.docs.invoices.map((i) => (
                <li key={i.id}>
                  <Link href={`/facturas/ver/?id=${i.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/60 sm:px-6">
                    <span className="font-mono text-sm">{i.number}</span>
                    <span className="flex-1 text-muted-foreground">{formatDate(i.date)}</span>
                    <span className="tabular">{formatEuros(i.totalCents)}</span>
                    <Badge status={i.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <div>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirm(`¿Borrar el cliente "${client.name}"?`)) return;
                try {
                  await deleteClient(client.id);
                  router.push("/clientes/");
                } catch (e) {
                  setError(e);
                }
              }}
            >
              <Trash2 />
              Borrar cliente
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
