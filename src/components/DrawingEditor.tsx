"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { FRAME_COLORS } from "@/lib/drawings/colors";

// Radix Select no admite valores vacíos.
const NO_COLOR = "__sin-color__";
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
          onValueChange={(v) => {
            const kind = v as DrawingKind;
            set({ kind, leaves: kind !== "ninguno" && value.leaves.length === 0 ? ["izq"] : value.leaves });
          }}
          options={(Object.keys(KIND_LABELS) as DrawingKind[]).map((k) => ({ value: k, label: KIND_LABELS[k] }))}
        />
      </Field>

      {value.kind !== "ninguno" ? (
        <>
          <Field label="Color del marco">
            <Select
              value={value.frameColor ?? NO_COLOR}
              onValueChange={(v) => set({ frameColor: v === NO_COLOR ? undefined : v })}
              options={[
                { value: NO_COLOR, label: "Sin indicar" },
                ...FRAME_COLORS.map((c) => ({
                  value: c.id,
                  label: (
                    <span className="inline-flex items-center gap-2.5">
                      <span className="size-4 shrink-0 rounded-full border border-slate-300 shadow-inner" style={{ background: c.fill }} />
                      {c.ref ? `${c.name} (${c.ref})` : c.name}
                    </span>
                  ),
                })),
              ]}
            />
          </Field>
          {value.kind === "inclinado" ? (
            <Field label="Lado inclinado">
              <Select
                value={value.slope ?? "arriba"}
                onValueChange={(v) => set({ slope: v as "arriba" | "abajo" })}
                options={[
                  { value: "arriba", label: "Arriba (base recta abajo)" },
                  { value: "abajo", label: "Abajo (lado recto arriba)" },
                ]}
              />
            </Field>
          ) : null}
          {value.kind !== "inclinado" ? (
          <>
          <div>
            <span className="text-sm font-medium text-slate-700">Nº de hojas</span>
            <div className="mt-1.5 inline-flex rounded-lg border bg-muted p-1">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLeafCount(n)}
                  className={`min-h-10 w-12 rounded-md text-lg font-semibold transition ${value.leaves.length === n ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
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
                  onValueChange={(v) => {
                    const leaves = [...value.leaves];
                    leaves[i] = v as LeafType;
                    set({ leaves });
                  }}
                  options={LEAF_OPTIONS.map((o) => ({ value: o, label: LEAF_LABELS[o] }))}
                />
              </Field>
            ))}
          </div>

          <button type="button" className="inline-flex items-center gap-1 self-start font-medium text-primary hover:underline" onClick={() => setShowFixed((v) => !v)}>
            <ChevronRight className={`size-4 transition-transform ${showFixed ? "rotate-90" : ""}`} /> Fijos superior / inferior / laterales
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
        </>
      ) : null}
    </div>
  );
}
