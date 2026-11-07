"use client";

import { useState } from "react";
import { Check, Download, ImageUp, Save, Trash2 } from "lucide-react";
import { useCompany } from "@/components/CompanyContext";
import { NumberingCard } from "@/components/NumberingCard";
import { Button, Card, CardTitle, ErrorBox, Field, Input, Loading, PageHeader, Select, Textarea } from "@/components/ui";
import { exportBackup, getSettings, saveSettings } from "@/lib/db";
import { isValidNumberFormat, todayIso } from "@/lib/dates";
import { fillQuoteNotes } from "@/lib/defaults";
import { useAsync } from "@/lib/useAsync";
import type { CompanySettings, VatRate } from "@/lib/types";

/** Reduce el logo para guardarlo dentro de Firestore (máx. ~200 KB, sin Cloud Storage). */
async function resizeImage(file: File, maxSize = 500): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("No se pudo leer la imagen."));
      i.src = url;
    });
    const k = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * k);
    canvas.height = Math.round(img.height * k);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    let data = canvas.toDataURL("image/png");
    if (data.length > 270_000) data = canvas.toDataURL("image/jpeg", 0.85);
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function SettingsPage() {
  const { data, loading, error } = useAsync(getSettings);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox error={error} />;
  return <SettingsForm initial={data} />;
}

function SettingsForm({ initial }: { initial: CompanySettings }) {
  const [s, setS] = useState(initial);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const { refresh } = useCompany();
  const set = <K extends keyof CompanySettings>(k: K, v: CompanySettings[K]) => {
    setS((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  async function save() {
    setError(null);
    if (!isValidNumberFormat(s.invoiceNumberFormat) || !isValidNumberFormat(s.quoteNumberFormat)) {
      setError(new Error("El formato de numeración tiene que incluir el número, por ejemplo {NNN}."));
      return;
    }
    setBusy(true);
    try {
      await saveSettings(s);
      setSaved(true);
      await refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function backup() {
    try {
      const json = await exportBackup();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      a.download = `copia-seguridad-${todayIso()}.json`;
      a.click();
    } catch (e) {
      setError(e);
    }
  }

  return (
    <>
      <PageHeader title="Ajustes" description="Datos de tu empresa, logo, textos de los documentos y numeración." />
      <ErrorBox error={error} />
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle description="Aparecen en la cabecera de presupuestos y facturas.">Datos de la empresa</CardTitle>
          <div className="grid gap-4 sm:grid-cols-6">
            <Field label="Nombre o razón social" className="sm:col-span-4">
              <Input value={s.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="NIF" className="sm:col-span-2">
              <Input value={s.nif} onChange={(e) => set("nif", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Dirección" className="sm:col-span-6">
              <Input value={s.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Código postal" className="sm:col-span-2">
              <Input value={s.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
            </Field>
            <Field label="Población" className="sm:col-span-2">
              <Input value={s.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Provincia" className="sm:col-span-2">
              <Input value={s.province} onChange={(e) => set("province", e.target.value)} />
            </Field>
            <Field label="Teléfono" className="sm:col-span-3">
              <Input value={s.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email" className="sm:col-span-3">
              <Input value={s.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="IBAN (aparece en las facturas)" className="sm:col-span-6">
              <Input value={s.iban} onChange={(e) => set("iban", e.target.value.toUpperCase())} placeholder="ES00 0000 0000 0000 0000 0000" />
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle description="Se muestra en la web (menú, pantalla de acceso e icono de la pestaña) y en los PDF.">Logo</CardTitle>
          <div className="flex flex-wrap items-center gap-4">
            {s.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logoDataUrl} alt="Logo" className="max-h-24 max-w-60 rounded-lg border bg-white p-2" />
            ) : (
              <span className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground">Sin logo</span>
            )}
            <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border bg-card px-5 font-semibold shadow-xs transition hover:bg-muted">
              <ImageUp className="size-5" />
              {s.logoDataUrl ? "Cambiar logo…" : "Subir logo…"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    set("logoDataUrl", await resizeImage(f));
                  } catch (err) {
                    setError(err);
                  }
                }}
              />
            </label>
            {s.logoDataUrl ? (
              <Button variant="ghost" onClick={() => set("logoDataUrl", "")}>
                <Trash2 />
                Quitar
              </Button>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardTitle>Presupuestos y facturas</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="IVA por defecto">
              <Select
                value={String(s.defaultVatRate)}
                onValueChange={(v) => set("defaultVatRate", Number(v) as VatRate)}
                options={[
                  { value: "21", label: "21% (general)" },
                  { value: "10", label: "10% (reforma de vivienda)" },
                ]}
              />
            </Field>
            <Field label="Validez del presupuesto (días)">
              <Input type="number" min={1} value={s.quoteValidityDays} onChange={(e) => set("quoteValidityDays", Number(e.target.value) || 30)} />
            </Field>
            <Field
              label="Observaciones por defecto de los presupuestos"
              className="sm:col-span-2"
              hint="Se ponen en cada presupuesto nuevo y allí se pueden cambiar. {DIES} = días de validez · {IBAN} = la cuenta de arriba."
            >
              <Textarea rows={5} value={s.quoteNotesTemplate} onChange={(e) => set("quoteNotesTemplate", e.target.value)} />
            </Field>
            {s.quoteNotesTemplate.trim() ? (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm sm:col-span-2">
                <p className="mb-1 font-medium text-muted-foreground">Así quedará en un presupuesto nuevo:</p>
                <p className="whitespace-pre-line">{fillQuoteNotes(s)}</p>
              </div>
            ) : null}
            <Field label="Forma de pago / pie de factura" className="sm:col-span-2">
              <Textarea value={s.invoiceFooter} onChange={(e) => set("invoiceFooter", e.target.value)} />
            </Field>
          </div>
        </Card>

        <NumberingCard
          formats={{ invoice: s.invoiceNumberFormat, quote: s.quoteNumberFormat }}
          onFormatChange={(kind, v) => set(kind === "invoice" ? "invoiceNumberFormat" : "quoteNumberFormat", v)}
        />

        <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-4 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur md:bottom-4">
          <Button onClick={save} disabled={busy} size="lg">
            <Save />
            {busy ? "Guardando…" : "Guardar ajustes"}
          </Button>
          {saved ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
              <Check className="size-4" /> Guardado
            </span>
          ) : null}
        </div>

        <Card>
          <CardTitle description="Descarga todos los datos (clientes, artículos, presupuestos y facturas) en un fichero. Recomendado una vez al mes.">
            Copia de seguridad
          </CardTitle>
          <Button variant="secondary" onClick={backup}>
            <Download />
            Descargar copia de seguridad
          </Button>
        </Card>
      </div>
    </>
  );
}
