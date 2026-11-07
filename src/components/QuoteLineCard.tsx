"use client";

import { useState } from "react";
import { DrawingSvg } from "@/lib/drawings/DrawingSvg";
import { centsToInput, formatEuros, lineTotalCents, parseEurosToCents } from "@/lib/money";
import type { QuoteLine } from "@/lib/types";
import { DrawingEditor } from "./DrawingEditor";
import { Card, Field, Input } from "./ui";

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
          className="flex h-40 w-full shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 hover:border-brand-500 sm:w-44"
          title="Editar dibujo"
        >
          <DrawingSvg params={line.drawing} widthMm={line.widthMm} heightMm={line.heightMm} className="h-full w-full text-slate-900" />
        </button>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start gap-2">
            <span className="mt-3 text-sm font-bold text-slate-400">{index + 1}</span>
            <Field label="Descripción" className="flex-1">
              <Input value={line.description} onChange={(e) => set({ description: e.target.value })} disabled={readOnly} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            <Field label="Precio unidad (€)">
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
                <button type="button" className="rounded-lg px-3 py-2 font-semibold text-brand-600 hover:bg-brand-50" onClick={() => setEditDrawing((v) => !v)}>
                  ✏️ {editDrawing ? "Cerrar dibujo" : hasDrawing ? "Editar dibujo" : "Añadir dibujo"}
                </button>
                <button type="button" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100" onClick={onDuplicate}>
                  Duplicar
                </button>
                <button type="button" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir">
                  ↑
                </button>
                <button type="button" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Bajar">
                  ↓
                </button>
                <button type="button" className="rounded-lg px-3 py-2 text-red-600 hover:bg-red-50" onClick={onRemove}>
                  Quitar
                </button>
              </div>
            ) : (
              <span />
            )}
            <span className="text-lg font-bold">{formatEuros(lineTotalCents(line.quantity, line.unitPriceCents))}</span>
          </div>
        </div>
      </div>
      {editDrawing && !readOnly ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <DrawingEditor value={line.drawing} onChange={(drawing) => set({ drawing })} />
        </div>
      ) : null}
    </Card>
  );
}
