"use client";

import { slopedLengthMm, slopedSides } from "@/lib/drawings/shapes";
import type { DrawingParams } from "@/lib/drawings/types";
import { Field, Input } from "./ui";

function Num({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      disabled={disabled}
    />
  );
}

/**
 * Medidas de un artículo: ancho y alto, o en el fijo inclinado base, lado izquierdo y lado derecho
 * (el alto se guarda como el mayor de los dos lados).
 */
export function MeasureFields({
  drawing,
  widthMm,
  heightMm,
  onChange,
  disabled,
}: {
  drawing: DrawingParams;
  widthMm: number;
  heightMm: number;
  onChange: (patch: { widthMm?: number; heightMm?: number; drawing?: DrawingParams }) => void;
  disabled?: boolean;
}) {
  if (drawing.kind !== "inclinado") {
    return (
      <>
        <Field label="Ancho (mm)">
          <Num value={widthMm} onChange={(n) => onChange({ widthMm: n })} disabled={disabled} />
        </Field>
        <Field label="Alto (mm)">
          <Num value={heightMm} onChange={(n) => onChange({ heightMm: n })} disabled={disabled} />
        </Field>
      </>
    );
  }
  const { left, right } = slopedSides(drawing, heightMm);
  const setSides = (l: number, r: number) =>
    onChange({ drawing: { ...drawing, leftHeightMm: l, rightHeightMm: r }, heightMm: Math.max(l, r) });
  return (
    <>
      <Field label="Base (mm)">
        <Num value={widthMm} onChange={(n) => onChange({ widthMm: n })} disabled={disabled} />
      </Field>
      <Field label="Lado izq. (mm)">
        <Num value={left} onChange={(n) => setSides(n, right)} disabled={disabled} />
      </Field>
      <Field label="Lado dcho. (mm)" hint={widthMm && left && right ? `Inclinado: ${slopedLengthMm(widthMm, left, right)} mm` : undefined}>
        <Num value={right} onChange={(n) => setSides(left, n)} disabled={disabled} />
      </Field>
    </>
  );
}
