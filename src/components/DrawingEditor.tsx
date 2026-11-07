"use client";

import { useState } from "react";
import { KIND_LABELS, LEAF_LABELS, type DrawingKind, type DrawingParams, type LeafType } from "@/lib/drawings/types";
import { Field, Input, Select } from "./ui";

const LEAF_OPTIONS = Object.keys(LEAF_LABELS) as LeafType[];

function NumberInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      step={10}
      value={value || ""}
      placeholder="0"
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
    />
  );
}

/** Controles para cambiar el dibujo: tipo, nº de hojas, apertura de cada hoja y fijos. */
export function DrawingEditor({ value, onChange }: { value: DrawingParams; onChange: (d: DrawingParams) => void }) {
  const [showFixed, setShowFixed] = useState(Boolean(value.topFixedMm || value.bottomFixedMm || value.sideLeftMm || value.sideRightMm));
  const set = (patch: Partial<DrawingParams>) => onChange({ ...value, ...patch });

  const setLeafCount = (n: number) => {
    const leaves = [...value.leaves];
    while (leaves.length < n) leaves.push(leaves[leaves.length - 1] ?? "izq");
    set({ leaves: leaves.slice(0, n) });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Tipo de dibujo">
        <Select
          value={value.kind}
          onChange={(e) => {
            const kind = e.target.value as DrawingKind;
            set({ kind, leaves: kind !== "ninguno" && value.leaves.length === 0 ? ["izq"] : value.leaves });
          }}
        >
          {(Object.keys(KIND_LABELS) as DrawingKind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </Select>
      </Field>

      {value.kind !== "ninguno" ? (
        <>
          <div>
            <span className="text-sm font-semibold text-slate-600">Nº de hojas</span>
            <div className="mt-1 flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLeafCount(n)}
                  className={`min-h-12 w-14 rounded-xl border text-lg font-bold ${value.leaves.length === n ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {value.leaves.map((leaf, i) => (
              <Field key={i} label={`Hoja ${i + 1}${value.leaves.length > 1 ? (i === 0 ? " (izquierda)" : i === value.leaves.length - 1 ? " (derecha)" : "") : ""}`}>
                <Select
                  value={leaf}
                  onChange={(e) => {
                    const leaves = [...value.leaves];
                    leaves[i] = e.target.value as LeafType;
                    set({ leaves });
                  }}
                >
                  {LEAF_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {LEAF_LABELS[o]}
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>

          <button type="button" className="self-start font-semibold text-brand-600 hover:underline" onClick={() => setShowFixed((v) => !v)}>
            {showFixed ? "▾" : "▸"} Fijos superior / inferior / laterales
          </button>
          {showFixed ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Fijo superior (alto mm)">
                <NumberInput value={value.topFixedMm} onChange={(n) => set({ topFixedMm: n })} />
              </Field>
              <Field label="Fijo inferior (alto mm)">
                <NumberInput value={value.bottomFixedMm} onChange={(n) => set({ bottomFixedMm: n })} />
              </Field>
              <Field label="Fijo izquierdo (ancho mm)">
                <NumberInput value={value.sideLeftMm} onChange={(n) => set({ sideLeftMm: n })} />
              </Field>
              <Field label="Fijo derecho (ancho mm)">
                <NumberInput value={value.sideRightMm} onChange={(n) => set({ sideRightMm: n })} />
              </Field>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
