"use client";

import Link from "next/link";
import { Plus, SquareStack } from "lucide-react";
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
      <PageHeader
        title="Artículos"
        description="Al añadirlos a un presupuesto se copian su dibujo, medidas y precio, que luego puedes cambiar."
        actions={
          <LinkButton href="/articulos/editar/">
            <Plus />
            Nuevo artículo
          </LinkButton>
        }
      />
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty icon={<SquareStack />}>No hay artículos.</Empty>
      ) : (
        categories.map((cat) => {
          const items = data.filter((a) => a.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat} className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{CATEGORY_LABELS[cat]}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((a) => (
                  <Link key={a.id} href={`/articulos/editar/?id=${a.id}`}>
                    <Card className={`h-full p-3 transition hover:border-primary hover:shadow-md sm:p-3 ${a.active ? "" : "opacity-50"}`}>
                      <DrawingSvg params={a.drawing} widthMm={a.defaultWidthMm} heightMm={a.defaultHeightMm} className="mb-3 h-32 w-full rounded-md bg-muted/50 p-2 text-slate-800" />
                      <p className="text-sm font-medium leading-tight">{a.name}</p>
                      {a.defaultPriceCents ? <p className="tabular text-sm text-muted-foreground">{formatEuros(a.defaultPriceCents)}</p> : null}
                      {!a.active ? <p className="text-xs text-muted-foreground">Desactivado</p> : null}
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
