"use client";

import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, ErrorBox, Field, PageHeader, Select } from "@/components/ui";
import { importClients, listClients } from "@/lib/db";
import { decodeText, guessMapping, IMPORT_FIELDS, normalizeNif, rowsToClients, type Mapping } from "@/lib/import/clients";

export default function ImportClientsPage() {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [existingNifs, setExistingNifs] = useState<Set<string>>(new Set());
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");

  async function onFile(file: File) {
    setError(null);
    setFileName(file.name);
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
      const [h, ...r] = table;
      setHeaders(h.map((x) => String(x).trim()));
      setRows(r);
      setMapping(guessMapping(h));
      const existing = await listClients();
      setExistingNifs(new Set(existing.map((c) => normalizeNif(c.nif)).filter(Boolean)));
    } catch (e) {
      setError(e);
    }
  }

  const clients = useMemo(() => rowsToClients(rows, mapping), [rows, mapping]);
  const toImport = useMemo(() => {
    if (!skipDuplicates) return clients;
    const seen = new Set(existingNifs);
    return clients.filter((c) => {
      const n = normalizeNif(c.nif);
      if (!n) return true;
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }, [clients, existingNifs, skipDuplicates]);

  async function doImport() {
    setBusy(true);
    setError(null);
    try {
      const n = await importClients(toImport);
      alert(`${n} clientes importados.`);
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
        <p className="mb-4 text-slate-600">
          Exporta los clientes desde InGnio a <strong>CSV</strong> o <strong>Excel (.xlsx)</strong> y súbelo aquí. La primera fila debe tener los nombres de las columnas.
        </p>
        <label className="inline-flex min-h-12 cursor-pointer items-center rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">
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
        {fileName ? <span className="ml-3 text-slate-600">{fileName}</span> : null}
      </Card>

      {headers.length > 0 ? (
        <>
          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-bold">1. ¿Qué columna es cada dato?</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {IMPORT_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <Select
                    value={mapping[f.key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  >
                    <option value="">— No importar —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Columna ${i + 1}`}
                      </option>
                    ))}
                  </Select>
                </Field>
              ))}
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="mb-2 text-xl font-bold">2. Revisa</h2>
            <label className="mb-4 flex items-center gap-3">
              <input type="checkbox" className="h-6 w-6" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} />
              Saltar clientes con un NIF que ya existe
            </label>
            <p className="mb-3 text-slate-600">
              Se importarán <strong>{toImport.length}</strong> de {clients.length} clientes.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="p-2">Nombre</th>
                    <th className="p-2">NIF</th>
                    <th className="p-2">Dirección</th>
                    <th className="p-2">Población</th>
                    <th className="p-2">Teléfono</th>
                    <th className="p-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {toImport.slice(0, 10).map((c, i) => (
                    <tr key={i} className="border-t border-slate-100">
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
              {toImport.length > 10 ? <p className="mt-2 text-sm text-slate-500">… y {toImport.length - 10} más</p> : null}
            </div>
          </Card>

          <Button onClick={doImport} disabled={busy || toImport.length === 0 || mapping.name === undefined}>
            {busy ? "Importando…" : `Importar ${toImport.length} clientes`}
          </Button>
        </>
      ) : null}
    </>
  );
}
