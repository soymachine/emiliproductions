"use client";

import { BadgePercent } from "lucide-react";
import { useState } from "react";
import { applyDiscount, computeTotals, formatEuros, parsePercent } from "@/lib/money";
import type { QuoteLine } from "@/lib/types";
import { Button, Card, CardTitle, Input } from "./ui";

/** Rebaja todos los precios del presupuesto un porcentaje (p. ej. «hazme un 25 % menos»). */
export function DiscountBox({
  lines,
  vatRate,
  onApply,
}: {
  lines: QuoteLine[];
  vatRate: number;
  onApply: (lines: QuoteLine[], pct: number) => void;
}) {
  const [text, setText] = useState("");
  const pct = parsePercent(text);
  const now = computeTotals(lines, vatRate).totalCents;
  const after = pct !== null ? computeTotals(applyDiscount(lines, pct), vatRate).totalCents : null;

  return (
    <Card>
      <CardTitle description="Rebaja el precio de cada línea en ese porcentaje.">Descuento</CardTitle>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (pct === null) return;
          const n = lines.length;
          if (!confirm(`Se rebajará un ${pct.toLocaleString("es-ES")} % el precio de ${n === 1 ? "la línea" : `las ${n} líneas`}. ¿Continuar?`)) return;
          onApply(applyDiscount(lines, pct), pct);
          setText("");
        }}
      >
        <div className="relative flex-1">
          <Input
            inputMode="decimal"
            placeholder="Ej.: 25"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Descuento en %"
            className="pr-9"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
        </div>
        <Button type="submit" variant="secondary" disabled={pct === null}>
          <BadgePercent />
          Aplicar
        </Button>
      </form>
      {text.trim() && pct === null ? <p className="mt-2 text-sm text-destructive">Escribe un porcentaje entre 0 y 100.</p> : null}
      {after !== null ? (
        <p className="tabular mt-3 text-sm text-muted-foreground">
          Total: <span className="line-through">{formatEuros(now)}</span> → <strong className="text-foreground">{formatEuros(after)}</strong>
        </p>
      ) : null}
    </Card>
  );
}
