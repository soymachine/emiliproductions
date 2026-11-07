"use client";

import { ArrowDown, ArrowUp, Copy, Maximize2, PencilRuler, Trash2, X } from "lucide-react";
import { useState } from "react";
import { DrawingSvg } from "@/lib/drawings/DrawingSvg";
import { frameColor, frameColorLabel } from "@/lib/drawings/colors";
import { centsToInput, formatEuros, lineTotalCents, parseEurosToCents } from "@/lib/money";
import type { QuoteLine } from "@/lib/types";
import { DrawingEditor } from "./DrawingEditor";
import { Button, Card, Field, Input, Modal, Textarea } from "./ui";

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
  const [zoom, setZoom] = useState(false);
  const [price, setPrice] = useState(line.unitPriceCents ? centsToInput(line.unitPriceCents) : "");
  const set = (patch: Partial<QuoteLine>) => onChange({ ...line, ...patch });
  const hasDrawing = line.drawing.kind !== "ninguno";
  const colorLabel = hasDrawing ? frameColorLabel(line.drawing.frameColor) : "";

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          disabled={!hasDrawing}
          onClick={() => setZoom(true)}
          className="group relative flex h-44 w-full shrink-0 cursor-zoom-in items-center justify-center rounded-lg border bg-muted/50 p-3 transition hover:border-primary hover:bg-accent disabled:cursor-default disabled:hover:border-border disabled:hover:bg-muted/50 sm:w-44"
          title={hasDrawing ? "Ver dibujo ampliado" : undefined}
          aria-label={hasDrawing ? "Ver dibujo ampliado" : "Sin dibujo"}
        >
          <DrawingSvg params={line.drawing} widthMm={line.widthMm} heightMm={line.heightMm} className="h-full w-full text-slate-900" />
          {hasDrawing ? (
            <span className="absolute right-2 top-2 rounded-md bg-card/90 p-1 text-muted-foreground opacity-70 shadow-xs transition group-hover:text-primary group-hover:opacity-100">
              <Maximize2 className="size-4" />
            </span>
          ) : null}
        </button>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start gap-2">
            <span className="mt-8 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">{index + 1}</span>
            <Field label="Descripción" className="flex-1">
              <Textarea
                value={line.description}
                onChange={(e) => set({ description: e.target.value })}
                disabled={readOnly}
                rows={Math.min(14, Math.max(7, line.description.split("\n").length))}
                className="leading-snug"
              />
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
            <span className="flex items-center gap-4">
              {colorLabel ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="size-3.5 rounded-full border border-slate-300" style={{ background: frameColor(line.drawing.frameColor)?.fill }} />
                  Color: {colorLabel}
                </span>
              ) : null}
              <span className="tabular text-lg font-bold">{formatEuros(lineTotalCents(line.quantity, line.unitPriceCents))}</span>
            </span>
          </div>
        </div>
      </div>
      {editDrawing && !readOnly ? (
        <div className="mt-5 rounded-lg border bg-muted/40 p-4">
          <DrawingEditor value={line.drawing} onChange={(drawing) => set({ drawing })} />
        </div>
      ) : null}
      {zoom ? (
        <Modal title={line.description.split("\n")[0] || "Dibujo"} onClose={() => setZoom(false)} wide>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center rounded-lg border bg-white p-4">
              <DrawingSvg params={line.drawing} widthMm={line.widthMm} heightMm={line.heightMm} className="h-[60vh] w-full text-slate-900" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground">
                {line.widthMm} × {line.heightMm} mm · {line.quantity} {line.quantity === 1 ? "unidad" : "unidades"}
              </p>
              {!readOnly ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setZoom(false);
                    setEditDrawing(true);
                  }}
                >
                  <PencilRuler />
                  Editar dibujo
                </Button>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}
    </Card>
  );
}
