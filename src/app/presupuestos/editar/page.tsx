"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ClientPicker } from "@/components/ClientPicker";
import { QuoteLineCard } from "@/components/QuoteLineCard";
import { Copy, Download, FilePlus2, Plus, Receipt, Save, Check, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardTitle, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { CATEGORY_LABELS, fillQuoteNotes } from "@/lib/defaults";
import {
  clientSnapshot,
  convertQuoteToInvoice,
  deleteQuote,
  getQuote,
  getSettings,
  listArticleTypes,
  listClients,
  newId,
  saveQuote,
  type QuoteDraft,
} from "@/lib/db";
import { addDaysIso, todayIso } from "@/lib/dates";
import { DrawingSvg } from "@/lib/drawings/DrawingSvg";
import { computeTotals, formatEuros } from "@/lib/money";
import { downloadQuotePdf } from "@/lib/pdf/download";
import { useAsync } from "@/lib/useAsync";
import type { ArticleCategory, ArticleType, Client, CompanySettings, Quote, QuoteLine, QuoteStatus, VatRate } from "@/lib/types";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <QuoteEditorLoader />
    </Suspense>
  );
}

function QuoteEditorLoader() {
  const params = useSearchParams();
  const id = params.get("id");
  const duplicateOf = params.get("duplicar");
  const presetClient = params.get("cliente");
  const { data, error, loading } = useAsync(async () => {
    const [quote, clients, articles, settings] = await Promise.all([
      id || duplicateOf ? getQuote((id || duplicateOf)!) : Promise.resolve(null),
      listClients(),
      listArticleTypes(),
      getSettings(),
    ]);
    return { quote, clients, articles, settings };
  }, [id, duplicateOf]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox error={error} />;
  if (id && !data.quote) return <ErrorBox error="Presupuesto no encontrado." />;

  const today = todayIso();
  let initial: QuoteDraft & { number?: string; invoiceId?: string | null };
  if (id && data.quote) {
    initial = data.quote;
  } else {
    const src = duplicateOf ? data.quote : null;
    const client = data.clients.find((c) => c.id === (src?.clientId ?? presetClient));
    initial = {
      date: today,
      validUntil: addDaysIso(today, data.settings.quoteValidityDays || 30),
      status: "borrador",
      clientId: client?.id ?? "",
      client: client ? clientSnapshot(client) : { name: "", nif: "", address: "", postalCode: "", city: "", province: "", phone: "", email: "" },
      lines: src ? src.lines.map((l) => ({ ...l, id: newId() })) : [],
      vatRate: src?.vatRate ?? data.settings.defaultVatRate,
      notes: src ? src.notes : fillQuoteNotes(data.settings),
    };
  }

  return <QuoteEditor key={id ?? `new-${duplicateOf ?? ""}`} initial={initial} clients={data.clients} articles={data.articles} settings={data.settings} />;
}

function lineFromArticle(a: ArticleType): QuoteLine {
  return {
    id: newId(),
    articleTypeId: a.id,
    description: a.name,
    drawing: structuredClone(a.drawing),
    widthMm: a.defaultWidthMm,
    heightMm: a.defaultHeightMm,
    quantity: 1,
    unitPriceCents: a.defaultPriceCents,
  };
}

function QuoteEditor({
  initial,
  clients: initialClients,
  articles,
  settings,
}: {
  initial: QuoteDraft & { number?: string; invoiceId?: string | null };
  clients: Client[];
  articles: ArticleType[];
  settings: CompanySettings;
}) {
  const router = useRouter();
  const [q, setQ] = useState<QuoteDraft>(initial);
  const [clients, setClients] = useState(initialClients);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [picking, setPicking] = useState(false);
  const [converting, setConverting] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(todayIso());

  const readOnly = Boolean(initial.invoiceId);
  const totals = useMemo(() => computeTotals(q.lines, q.vatRate), [q.lines, q.vatRate]);

  const update = (patch: Partial<QuoteDraft>) => {
    setQ((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };
  const setLines = (fn: (lines: QuoteLine[]) => QuoteLine[]) => update({ lines: fn(q.lines) });

  const selectClient = (c: Client) => update({ clientId: c.id, client: clientSnapshot(c) });

  async function save(): Promise<string | null> {
    setError(null);
    if (!q.clientId) {
      setError(new Error("Elige un cliente antes de guardar."));
      return null;
    }
    // Refresca la copia de los datos del cliente con la ficha actual.
    const client = clients.find((c) => c.id === q.clientId);
    const draft = { ...q, client: client ? clientSnapshot(client) : q.client };
    const id = await saveQuote(draft);
    setDirty(false);
    if (!q.id) {
      setQ({ ...draft, id });
      router.replace(`/presupuestos/editar/?id=${id}`);
    }
    return id;
  }

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }

  async function pdf(layout: "compact" | "large") {
    await run(`pdf-${layout}`, async () => {
      const id = readOnly ? q.id! : await save();
      if (!id) return;
      const fresh = (await getQuote(id)) as Quote;
      await downloadQuotePdf(fresh, settings, layout);
    });
  }

  async function convert() {
    await run("convert", async () => {
      const id = await save();
      if (!id) return;
      const invoiceId = await convertQuoteToInvoice(id, invoiceDate);
      router.push(`/facturas/ver/?id=${invoiceId}`);
    });
  }

  const title = initial.number ? `Presupuesto ${initial.number}` : "Nuevo presupuesto";

  return (
    <>
      <PageHeader
        title={title}
        back={{ href: "/presupuestos/", label: "Presupuestos" }}
        actions={initial.number ? <Badge status={q.status} /> : null}
      />
      <ErrorBox error={error} />
      {readOnly ? (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-4 text-violet-900">
          Este presupuesto ya está facturado y no se puede modificar.{" "}
          <Link className="font-semibold underline" href={`/facturas/ver/?id=${initial.invoiceId}`}>
            Ver factura
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardTitle>Cliente</CardTitle>
            <ClientPicker
              clients={clients}
              selectedId={q.clientId}
              onSelect={selectClient}
              onCreated={(c) => {
                setClients((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
                selectClient(c);
              }}
              disabled={readOnly}
            />
          </Card>

          <div className="mt-2 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Artículos</h2>
            {q.lines.length ? <span className="text-sm text-muted-foreground">{q.lines.length} {q.lines.length === 1 ? "línea" : "líneas"}</span> : null}
          </div>
          {q.lines.length === 0 ? <Empty icon={<FilePlus2 />}>Añade el primer artículo al presupuesto.</Empty> : null}
          {q.lines.map((line, i) => (
            <QuoteLineCard
              key={line.id}
              line={line}
              index={i}
              count={q.lines.length}
              readOnly={readOnly}
              onChange={(l) => setLines((ls) => ls.map((x) => (x.id === l.id ? l : x)))}
              onRemove={() => setLines((ls) => ls.filter((x) => x.id !== line.id))}
              onDuplicate={() => setLines((ls) => [...ls.slice(0, i + 1), { ...structuredClone(line), id: newId() }, ...ls.slice(i + 1)])}
              onMove={(dir) =>
                setLines((ls) => {
                  const next = [...ls];
                  const j = i + dir;
                  [next[i], next[j]] = [next[j], next[i]];
                  return next;
                })
              }
            />
          ))}
          {!readOnly ? (
            <Button variant="outline" size="lg" className="min-h-16 bg-card/60" onClick={() => setPicking(true)}>
              <Plus />
              Añadir artículo
            </Button>
          ) : null}

          <Card>
            <Field label="Observaciones (aparecen en el PDF)" hint={readOnly ? undefined : "El texto inicial se cambia en Ajustes → Observaciones por defecto."}>
              <Textarea rows={5} value={q.notes} onChange={(e) => update({ notes: e.target.value })} disabled={readOnly} />
            </Field>
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
          <Card className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Field label="Fecha">
                <Input type="date" value={q.date} onChange={(e) => update({ date: e.target.value })} disabled={readOnly || Boolean(q.id)} />
              </Field>
              <Field label="Válido hasta">
                <Input type="date" value={q.validUntil} onChange={(e) => update({ validUntil: e.target.value })} disabled={readOnly} />
              </Field>
            </div>
            <Field label="IVA">
              <Select
                value={String(q.vatRate)}
                onValueChange={(v) => update({ vatRate: Number(v) as VatRate })}
                disabled={readOnly}
                options={[
                  { value: "21", label: "21% (general)" },
                  { value: "10", label: "10% (reforma de vivienda)" },
                ]}
              />
            </Field>
            {!readOnly ? (
              <Field label="Estado">
                <Select
                  value={q.status}
                  onValueChange={(v) => update({ status: v as QuoteStatus })}
                  options={[
                    { value: "borrador", label: "Borrador" },
                    { value: "enviado", label: "Enviado" },
                    { value: "aceptado", label: "Aceptado" },
                    { value: "rechazado", label: "Rechazado" },
                  ]}
                />
              </Field>
            ) : null}
            <dl className="tabular mt-2 flex flex-col gap-1.5 rounded-lg bg-muted/60 p-4">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Base imponible</dt>
                <dd>{formatEuros(totals.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">IVA {q.vatRate}%</dt>
                <dd>{formatEuros(totals.vatCents)}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t pt-2 text-2xl font-bold text-primary">
                <dt>Total</dt>
                <dd>{formatEuros(totals.totalCents)}</dd>
              </div>
            </dl>
          </Card>

          {!readOnly ? (
            <Button onClick={() => run("save", async () => void (await save()))} disabled={busy !== null}>
              {busy === "save" ? (
                "Guardando…"
              ) : dirty || !q.id ? (
                <>
                  <Save /> Guardar
                </>
              ) : (
                <>
                  <Check /> Guardado
                </>
              )}
            </Button>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => pdf("compact")} disabled={busy !== null || q.lines.length === 0} className="px-3">
              <Download />
              {busy === "pdf-compact" ? "Generando…" : "PDF dibujos pequeños"}
            </Button>
            <Button variant="secondary" onClick={() => pdf("large")} disabled={busy !== null || q.lines.length === 0} className="px-3">
              <Download />
              {busy === "pdf-large" ? "Generando…" : "PDF dibujos grandes"}
            </Button>
          </div>
          {!readOnly ? (
            <Button variant="secondary" onClick={() => setConverting(true)} disabled={busy !== null || q.lines.length === 0 || !q.clientId}>
              <Receipt />
              Convertir en factura
            </Button>
          ) : null}
          {q.id ? (
            <Button variant="ghost" onClick={() => router.push(`/presupuestos/editar/?duplicar=${q.id}`)}>
              <Copy />
              Duplicar presupuesto
            </Button>
          ) : null}
          {q.id && !readOnly ? (
            <Button
              variant="danger"
              onClick={() =>
                run("delete", async () => {
                  if (!confirm("¿Borrar este presupuesto?")) return;
                  await deleteQuote(q.id!);
                  router.push("/presupuestos/");
                })
              }
            >
              <Trash2 />
              Borrar presupuesto
            </Button>
          ) : null}
        </aside>
      </div>

      {picking ? (
        <ArticlePicker
          articles={articles}
          onClose={() => setPicking(false)}
          onPick={(a) => {
            setLines((ls) => [...ls, lineFromArticle(a)]);
            setPicking(false);
          }}
        />
      ) : null}

      {converting ? (
        <Modal title="Convertir en factura" onClose={() => setConverting(false)}>
          <p className="mb-4 text-muted-foreground">
            Se creará una factura con el siguiente número correlativo, con los mismos datos y artículos (sin dibujos). Después el presupuesto ya no se podrá modificar.
          </p>
          <Field label="Fecha de la factura" className="mb-4">
            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </Field>
          <p className="tabular mb-4 text-xl font-bold">Total: {formatEuros(totals.totalCents)}</p>
          <Button onClick={convert} disabled={busy !== null}>
            {busy === "convert" ? "Creando factura…" : "Crear factura"}
          </Button>
        </Modal>
      ) : null}
    </>
  );
}

function ArticlePicker({ articles, onPick, onClose }: { articles: ArticleType[]; onPick: (a: ArticleType) => void; onClose: () => void }) {
  const active = articles.filter((a) => a.active);
  return (
    <Modal title="Añadir artículo" onClose={onClose} wide>
      {(Object.keys(CATEGORY_LABELS) as ArticleCategory[]).map((cat) => {
        const items = active.filter((a) => a.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat} className="mb-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{CATEGORY_LABELS[cat]}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onPick(a)}
                  className="flex flex-col items-center rounded-lg border bg-card p-3 text-center transition hover:border-primary hover:bg-accent"
                >
                  <DrawingSvg params={a.drawing} widthMm={a.defaultWidthMm} heightMm={a.defaultHeightMm} className="mb-2 h-24 w-full text-slate-800" />
                  <span className="text-sm font-medium leading-tight">{a.name}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
      {active.length === 0 ? <Empty>No hay artículos activos en el catálogo.</Empty> : null}
    </Modal>
  );
}
