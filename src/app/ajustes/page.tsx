"use client";

import { useState } from "react";
import { NumberingCard } from "@/components/NumberingCard";
import { Button, Card, ErrorBox, Field, Input, Loading, PageHeader, Select, Textarea } from "@/components/ui";
import { exportBackup, getSettings, saveSettings } from "@/lib/db";
import { isValidNumberFormat, todayIso } from "@/lib/dates";
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
      <PageHeader title="Ajustes" />
      <ErrorBox error={error} />
      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="mb-4 text-xl font-bold">Datos de la empresa</h2>
          <p className="mb-4 text-slate-600">Aparecen en la cabecera de presupuestos y facturas.</p>
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
          <h2 className="mb-4 text-xl font-bold">Logo</h2>
          <div className="flex flex-wrap items-center gap-4">
            {s.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logoDataUrl} alt="Logo" className="max-h-24 max-w-60 rounded-lg border border-slate-200 bg-white p-2" />
            ) : (
              <span className="text-slate-500">Sin logo</span>
            )}
            <label className="inline-flex min-h-12 cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-5 font-semibold hover:bg-slate-50">
              Subir logo…
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
                Quitar
              </Button>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-bold">Presupuestos y facturas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="IVA por defecto">
              <Select value={s.defaultVatRate} onChange={(e) => set("defaultVatRate", Number(e.target.value) as VatRate)}>
                <option value={21}>21%</option>
                <option value={10}>10%</option>
              </Select>
            </Field>
            <Field label="Validez del presupuesto (días)">
              <Input type="number" min={1} value={s.quoteValidityDays} onChange={(e) => set("quoteValidityDays", Number(e.target.value) || 30)} />
            </Field>
            <Field label="Condiciones del presupuesto" className="sm:col-span-2">
              <Textarea rows={4} value={s.quoteConditions} onChange={(e) => set("quoteConditions", e.target.value)} />
            </Field>
            <Field label="Forma de pago / pie de factura" className="sm:col-span-2">
              <Textarea value={s.invoiceFooter} onChange={(e) => set("invoiceFooter", e.target.value)} />
            </Field>
          </div>
        </Card>

        <NumberingCard
          formats={{ invoice: s.invoiceNumberFormat, quote: s.quoteNumberFormat }}
          onFormatChange={(kind, v) => set(kind === "invoice" ? "invoiceNumberFormat" : "quoteNumberFormat", v)}
        />

        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={save} disabled={busy}>
            {busy ? "Guardando…" : "Guardar ajustes"}
          </Button>
          {saved ? <span className="font-semibold text-green-700">✓ Guardado</span> : null}
        </div>

        <Card>
          <h2 className="mb-2 text-xl font-bold">Copia de seguridad</h2>
          <p className="mb-4 text-slate-600">Descarga todos los datos (clientes, artículos, presupuestos y facturas) en un fichero. Recomendado una vez al mes.</p>
          <Button variant="secondary" onClick={backup}>
            ⬇️ Descargar copia de seguridad
          </Button>
        </Card>
      </div>
    </>
  );
}
