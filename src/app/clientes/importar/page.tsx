"use client";

import Papa from "papaparse";
import { FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, CardTitle, ErrorBox, Field, PageHeader, Select } from "@/components/ui";
import { importClients, listClients } from "@/lib/db";
import type { Client } from "@/lib/types";
import { decodeText, guessMapping, IMPORT_FIELDS, planImport, rowsToClients, type Mapping } from "@/lib/import/clients";

// Radix Select no admite valores vacíos.
const NONE = "__ninguna__";

export default function ImportClientsPage() {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [existing, setExisting] = useState<Client[]>([]);
  const [mode, setMode] = useState<"update" | "skip">("update");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");

  async function onFile(file: File) {
    setError(null);
    setFileName(file.name);
    setHeaders([]);
    try {
      let table: string[][];
      if (/\.xlsx$/i.test(file.name)) {
        const { default: readXlsxFile } = await import("read-excel-file");
        const data = await readXlsxFile(file);
        table = data.map((r) => r.map((cell) => (cell == null ? "" : cell instanceof Date ? cell.toLocaleDateString("es-ES") : String(cell))));
      } else {
        const text = decodeText(await file.arrayBuffer());
        const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
        table = parsed.data;
      }
      if (table.length < 2) throw new Error("El fichero no tiene datos (se espera una fila de cabecera y al menos un cliente).");
      // Primero los clientes que ya hay, para no mostrar el botón antes de saber cuáles se actualizan.
      const current = await listClients();
      const [h, ...r] = table;
      setExisting(current);
      setHeaders(h.map((x) => String(x).trim()));
      setRows(r);
      setMapping(guessMapping(h));
    } catch (e) {
      setError(e);
    }
  }

  const clients = useMemo(() => rowsToClients(rows, mapping), [rows, mapping]);
  const plan = useMemo(() => planImport(clients, existing, mode), [clients, existing, mode]);
  const total = plan.toCreate.length + plan.toUpdate.length;
  const preview = useMemo(() => {
    const byId = new Map(existing.map((e) => [e.id, e]));
    const upd = plan.toUpdate.map((u) => ({ c: { ...byId.get(u.id)!, ...u.patch }, tag: "Actualizar" }));
    const created = plan.toCreate.map((c) => ({ c, tag: "Nuevo" }));
    return [...upd, ...created].slice(0, 10);
  }, [plan, existing]);

  async function doImport() {
    setBusy(true);
    setError(null);
    try {
      const r = await importClients(plan.toCreate, plan.toUpdate);
      alert(`Listo: ${r.created} clientes nuevos y ${r.updated} actualizados.`);
      router.push("/clientes/");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Importar clientes" back={{ href: "/clientes/", label: "Clientes" }} />
      <ErrorBox error={error} />
      <Card className="mb-6">
        <p className="mb-4 text-muted-foreground">
          Exporta los clientes desde InGnio a <strong>CSV</strong> o <strong>Excel (.xlsx)</strong> y súbelo aquí. La primera fila debe tener los nombres de las columnas.
        </p>
        <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-white hover:bg-primary/90">
          <FileSpreadsheet className="size-5" />
          Elegir fichero…
          <input
            type="file"
            accept=".csv,.txt,.xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </label>
        {fileName ? <span className="ml-3 text-muted-foreground">{fileName}</span> : null}
      </Card>

      {headers.length > 0 ? (
        <>
          <Card className="mb-6">
            <CardTitle description="La app lo ha intentado adivinar por el nombre de las columnas. Corrige lo que no cuadre.">1. ¿Qué columna es cada dato?</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {IMPORT_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <Select
                    value={mapping[f.key] === undefined ? NONE : String(mapping[f.key])}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === NONE ? undefined : Number(v) }))}
                    options={[
                      { value: NONE, label: "— No importar —" },
                      ...headers.map((h, i) => ({ value: String(i), label: h || `Columna ${i + 1}` })),
                    ]}
                  />
                </Field>
              ))}
            </div>
          </Card>

          <Card className="mb-6">
            <CardTitle>2. Revisa</CardTitle>
            <Field label="Si el cliente ya existe en la app (mismo NIF o, si no tiene, mismo nombre)" className="mb-4 max-w-xl">
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as "update" | "skip")}
                options={[
                  { value: "update", label: "Actualizarlo: añadir el código y rellenar lo que falte" },
                  { value: "skip", label: "Dejarlo como está" },
                ]}
              />
            </Field>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-sm text-muted-foreground">Nuevos</p>
                <p className="text-2xl font-bold">{plan.toCreate.length}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-sm text-muted-foreground">Se actualizarán</p>
                <p className="text-2xl font-bold">{plan.toUpdate.length}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-sm text-muted-foreground">Sin cambios</p>
                <p className="text-2xl font-bold">{plan.unchanged}</p>
              </div>
            </div>
            {mapping.code === undefined ? (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                No has elegido la columna del <strong>código de cliente</strong>. Si tu fichero la tiene, selecciónala arriba para conservarla.
              </p>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="p-2"></th>
                    <th className="p-2">Código</th>
                    <th className="p-2">Nombre</th>
                    <th className="p-2">NIF</th>
                    <th className="p-2">Dirección</th>
                    <th className="p-2">Población</th>
                    <th className="p-2">Teléfono</th>
                    <th className="p-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map(({ c, tag }, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tag === "Nuevo" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800"}`}>
                          {tag}
                        </span>
                      </td>
                      <td className="p-2 font-mono">{c.code}</td>
                      <td className="p-2 font-semibold">{c.name}</td>
                      <td className="p-2">{c.nif}</td>
                      <td className="p-2">{c.address}</td>
                      <td className="p-2">{c.city}</td>
                      <td className="p-2">{c.phone}</td>
                      <td className="p-2">{c.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {total > preview.length ? <p className="mt-2 text-sm text-muted-foreground">… y {total - preview.length} más</p> : null}
            </div>
          </Card>

          <Button onClick={doImport} disabled={busy || total === 0 || mapping.name === undefined} size="lg">
            {busy ? "Importando…" : `Crear ${plan.toCreate.length} y actualizar ${plan.toUpdate.length}`}
          </Button>
        </>
      ) : null}
    </>
  );
}
