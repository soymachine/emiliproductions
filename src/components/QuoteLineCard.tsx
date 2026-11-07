"use client";

import { ArrowDown, ArrowUp, Copy, PencilRuler, Trash2, X } from "lucide-react";
import { useState } from "react";
import { DrawingSvg } from "@/lib/drawings/DrawingSvg";
import { centsToInput, formatEuros, lineTotalCents, parseEurosToCents } from "@/lib/money";
import type { QuoteLine } from "@/lib/types";
import { DrawingEditor } from "./DrawingEditor";
import { Card, Field, Input } from "./ui";

const btn =
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30 [&_svg]:size-4";

export function QuoteLineCard({
  line,
  index,
  count,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
  readOnly,
}: {
  line: QuoteLine;
  index: number;
  count: number;
  onChange: (l: QuoteLine) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMove: (dir: -1 | 1) => void;
  readOnly: boolean;
}) {
  const [editDrawing, setEditDrawing] = useState(false);
  const [price, setPrice] = useState(line.unitPriceCents ? centsToInput(line.unitPriceCents) : "");
  const set = (patch: Partial<QuoteLine>) => onChange({ ...line, ...patch });
  const hasDrawing = line.drawing.kind !== "ninguno";

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => setEditDrawing((v) => !v)}
          className="flex h-44 w-full shrink-0 items-center justify-center rounded-lg border bg-muted/50 p-3 transition hover:border-primary hover:bg-accent sm:w-44"
          title="Editar dibujo"
        >
          <DrawingSvg params={line.drawing} widthMm={line.widthMm} heightMm={line.heightMm} className="h-full w-full text-slate-900" />
        </button>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start gap-2">
            <span className="mt-8 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">{index + 1}</span>
            <Field label="Descripción" className="flex-1">
              <Input value={line.description} onChange={(e) => set({ description: e.target.value })} disabled={readOnly} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Field label="Ancho (mm)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={line.widthMm || ""}
                onChange={(e) => set({ widthMm: Number(e.target.value) || 0 })}
                disabled={readOnly}
              />
            </Field>
            <Field label="Alto (mm)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={line.heightMm || ""}
                onChange={(e) => set({ heightMm: Number(e.target.value) || 0 })}
                disabled={readOnly}
              />
            </Field>
            <Field label="Cantidad">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={line.quantity || ""}
                onChange={(e) => set({ quantity: Number(e.target.value) || 0 })}
                disabled={readOnly}
              />
            </Field>
            <Field label="Precio (€)">
              <Input
                inputMode="decimal"
                value={price}
                placeholder="0,00"
                onChange={(e) => {
                  setPrice(e.target.value);
                  set({ unitPriceCents: parseEurosToCents(e.target.value) ?? 0 });
                }}
                onBlur={() => setPrice(line.unitPriceCents ? centsToInput(line.unitPriceCents) : "")}
                disabled={readOnly}
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!readOnly ? (
              <div className="flex flex-wrap gap-1 text-sm">
                <button type="button" className={btn + " font-medium text-primary hover:bg-accent"} onClick={() => setEditDrawing((v) => !v)}>
                  {editDrawing ? <X /> : <PencilRuler />}
                  {editDrawing ? "Cerrar dibujo" : hasDrawing ? "Editar dibujo" : "Añadir dibujo"}
                </button>
                <button type="button" className={btn} onClick={onDuplicate}>
                  <Copy />
                  Duplicar
                </button>
                <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir" title="Subir">
                  <ArrowUp />
                </button>
                <button type="button" className={btn} disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Bajar" title="Bajar">
                  <ArrowDown />
                </button>
                <button type="button" className={btn + " text-destructive hover:bg-red-50"} onClick={onRemove}>
                  <Trash2 />
                  Quitar
                </button>
              </div>
            ) : (
              <span />
            )}
            <span className="tabular text-lg font-bold">{formatEuros(lineTotalCents(line.quantity, line.unitPriceCents))}</span>
          </div>
        </div>
      </div>
      {editDrawing && !readOnly ? (
        <div className="mt-5 rounded-lg border bg-muted/40 p-4">
          <DrawingEditor value={line.drawing} onChange={(drawing) => set({ drawing })} />
        </div>
      ) : null}
    </Card>
  );
}
