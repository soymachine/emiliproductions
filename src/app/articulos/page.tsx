"use client";

import Link from "next/link";
import { Card, Empty, ErrorBox, LinkButton, Loading, PageHeader } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/defaults";
import { listArticleTypes } from "@/lib/db";
import { DrawingSvg } from "@/lib/drawings/DrawingSvg";
import { formatEuros } from "@/lib/money";
import { useAsync } from "@/lib/useAsync";
import type { ArticleCategory } from "@/lib/types";

export default function ArticlesPage() {
  const { data, error, loading } = useAsync(listArticleTypes);
  const categories = Object.keys(CATEGORY_LABELS) as ArticleCategory[];

  return (
    <>
      <PageHeader title="Artículos" actions={<LinkButton href="/articulos/editar/">＋ Nuevo artículo</LinkButton>} />
      <p className="mb-6 text-slate-600">
        Catálogo de tipos de artículo. Al añadirlos a un presupuesto se copia su dibujo, medidas y precio orientativo, que luego puedes cambiar.
      </p>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>No hay artículos.</Empty>
      ) : (
        categories.map((cat) => {
          const items = data.filter((a) => a.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat} className="mb-8">
              <h2 className="mb-3 text-xl font-bold">{CATEGORY_LABELS[cat]}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {items.map((a) => (
                  <Link key={a.id} href={`/articulos/editar/?id=${a.id}`}>
                    <Card className={`h-full p-3 hover:ring-brand-500 ${a.active ? "" : "opacity-50"}`}>
                      <DrawingSvg params={a.drawing} widthMm={a.defaultWidthMm} heightMm={a.defaultHeightMm} className="mb-2 h-32 w-full text-slate-800" />
                      <p className="font-semibold leading-tight">{a.name}</p>
                      {a.defaultPriceCents ? <p className="text-sm text-slate-500">{formatEuros(a.defaultPriceCents)}</p> : null}
                      {!a.active ? <p className="text-xs text-slate-500">Desactivado</p> : null}
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
