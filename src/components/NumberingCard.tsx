"use client";

import { useEffect, useState } from "react";
import { getLastNumber, setLastNumber, type CounterKind } from "@/lib/db";
import { formatDocNumber, isValidNumberFormat } from "@/lib/dates";
import { Button, Card, CardTitle, ErrorBox, Field, Input, Select } from "./ui";

const LABELS: Record<CounterKind, { title: string; plural: string }> = {
  invoice: { title: "Facturas", plural: "facturas" },
  quote: { title: "Presupuestos", plural: "presupuestos" },
};

/**
 * Formato del número y contador de cada año. Los formatos se guardan con el botón general de Ajustes;
 * el contador se guarda aquí mismo.
 */
export function NumberingCard({
  formats,
  onFormatChange,
}: {
  formats: Record<CounterKind, string>;
  onFormatChange: (kind: CounterKind, value: string) => void;
}) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);

  return (
    <Card>
      <CardTitle description="Cada año la numeración empieza sola desde 1: el año lo marca la fecha del documento. Si vienes de otro programa, indica el último número que usaste y la app seguirá a partir del siguiente.">
        Numeración
      </CardTitle>
      <Field label="Año" className="mb-4 max-w-48">
        <Select
          value={String(year)}
          onValueChange={(v) => setYear(Number(v))}
          options={[thisYear - 1, thisYear, thisYear + 1].map((y) => ({ value: String(y), label: String(y) }))}
        />
      </Field>
      <div className="grid gap-6 lg:grid-cols-2">
        {(["invoice", "quote"] as CounterKind[]).map((kind) => (
          <CounterEditor key={`${kind}-${year}`} kind={kind} year={year} format={formats[kind]} onFormatChange={(v) => onFormatChange(kind, v)} />
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Formato: <code>{"{AAAA}"}</code> = año (2026), <code>{"{AA}"}</code> = año corto (26), <code>{"{NNN}"}</code> = número con 3 cifras
        (001). Pon tantas N como cifras quieras. Ejemplos: <code>{"F-{AAAA}-{NNN}"}</code> → F-2026-001 · <code>{"{AA}/{NNNN}"}</code> → 26/0001.
        Los cambios de formato se guardan con el botón «Guardar ajustes»; el contador, con su propio botón.
      </p>
    </Card>
  );
}

function CounterEditor({
  kind,
  year,
  format,
  onFormatChange,
}: {
  kind: CounterKind;
  year: number;
  format: string;
  onFormatChange: (v: string) => void;
}) {
  const [last, setLast] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getLastNumber(kind, year)
      .then((n) => {
        setLast(n);
        setInput(String(n));
      })
      .catch(setError);
  }, [kind, year]);

  const parsed = Number(input);
  const valid = input.trim() !== "" && Number.isInteger(parsed) && parsed >= 0;
  const formatOk = isValidNumberFormat(format);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await setLastNumber(kind, year, parsed);
      setLast(parsed);
      setSaved(true);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
      <h3 className="font-semibold">{LABELS[kind].title}</h3>
      <Field label="Formato del número">
        <Input value={format} onChange={(e) => onFormatChange(e.target.value)} className="font-mono" />
      </Field>
      {!formatOk ? <p className="text-sm text-red-700">El formato tiene que incluir el número, por ejemplo {"{NNN}"}.</p> : null}
      <Field label={`Último número usado en ${year}`} hint={`Pon 0 si en ${year} todavía no has hecho ${LABELS[kind].plural}.`}>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setSaved(false);
          }}
          disabled={last === null}
        />
      </Field>
      <p className="rounded-md border bg-card px-3 py-2 text-slate-700">
        La siguiente será:{" "}
        <strong className="font-mono text-lg text-primary">{valid ? formatDocNumber(format, year, parsed + 1) : "—"}</strong>
      </p>
      <ErrorBox error={error} />
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={save} disabled={busy || !valid || last === null || parsed === last}>
          {busy ? "Guardando…" : "Guardar contador"}
        </Button>
        {saved ? <span className="font-medium text-emerald-700">Guardado</span> : null}
      </div>
    </div>
  );
}
