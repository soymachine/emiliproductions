"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { DrawingEditor } from "@/components/DrawingEditor";
import { Button, Card, ErrorBox, Field, Input, Loading, PageHeader, Select } from "@/components/ui";
import { CATEGORY_LABELS, drawing } from "@/lib/defaults";
import { deleteArticleType, listArticleTypes, saveArticleType } from "@/lib/db";
import { DrawingSvg } from "@/lib/drawings/DrawingSvg";
import { centsToInput, parseEurosToCents } from "@/lib/money";
import { useAsync } from "@/lib/useAsync";
import type { ArticleCategory, ArticleType } from "@/lib/types";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <EditArticle />
    </Suspense>
  );
}

function EditArticle() {
  const id = useSearchParams().get("id");
  const { data, loading } = useAsync(listArticleTypes);
  if (loading || !data) return <Loading />;
  const existing = id ? data.find((a) => a.id === id) : undefined;
  if (id && !existing) return <ErrorBox error="Artículo no encontrado." />;
  const initial: Omit<ArticleType, "id"> & { id?: string } = existing ?? {
    name: "",
    category: "ventana",
    drawing: drawing("ventana", ["izq"]),
    defaultWidthMm: 1000,
    defaultHeightMm: 1000,
    defaultPriceCents: 0,
    active: true,
    order: data.length,
  };
  return <ArticleForm key={id ?? "new"} initial={initial} />;
}

function ArticleForm({ initial }: { initial: Omit<ArticleType, "id"> & { id?: string } }) {
  const router = useRouter();
  const [a, setA] = useState(initial);
  const [price, setPrice] = useState(initial.defaultPriceCents ? centsToInput(initial.defaultPriceCents) : "");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<ArticleType>) => setA((prev) => ({ ...prev, ...patch }));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await saveArticleType({ ...a, name: a.name.trim(), defaultPriceCents: parseEurosToCents(price) ?? 0 });
      router.push("/articulos/");
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title={initial.id ? a.name || "Artículo" : "Nuevo artículo"} back={{ href: "/articulos/", label: "Artículos" }} />
      <ErrorBox error={error} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="flex flex-col gap-4">
          <Field label="Nombre *">
            <Input value={a.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej.: Corredera 2 hojas" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría">
              <Select
                value={a.category}
                onValueChange={(v) => set({ category: v as ArticleCategory })}
                options={(Object.keys(CATEGORY_LABELS) as ArticleCategory[]).map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
              />
            </Field>
            <Field label="Precio orientativo (€)">
              <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
            </Field>
            <Field label="Ancho por defecto (mm)">
              <Input type="number" inputMode="numeric" value={a.defaultWidthMm || ""} onChange={(e) => set({ defaultWidthMm: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Alto por defecto (mm)">
              <Input type="number" inputMode="numeric" value={a.defaultHeightMm || ""} onChange={(e) => set({ defaultHeightMm: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          <hr />
          <DrawingEditor value={a.drawing} onChange={(d) => set({ drawing: d })} />
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-6 w-6" checked={a.active} onChange={(e) => set({ active: e.target.checked })} />
            Activo (aparece al añadir líneas a un presupuesto)
          </label>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="lg:sticky lg:top-8">
            <DrawingSvg params={a.drawing} widthMm={a.defaultWidthMm} heightMm={a.defaultHeightMm} className="h-72 w-full rounded-lg bg-muted/50 p-3 text-slate-900" />
          </Card>
          <Button onClick={save} disabled={busy || !a.name.trim()}>
            {busy ? "Guardando…" : "Guardar artículo"}
          </Button>
          {initial.id ? (
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirm("¿Borrar este artículo del catálogo? Los presupuestos existentes no cambian.")) return;
                await deleteArticleType(initial.id!);
                router.push("/articulos/");
              }}
            >
              Borrar artículo
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
