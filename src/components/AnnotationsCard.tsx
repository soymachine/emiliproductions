"use client";

import { Check, Save } from "lucide-react";
import { useState } from "react";
import { setInvoiceAnnotations } from "@/lib/db";
import type { Invoice } from "@/lib/types";
import { Button, Card, CardTitle, ErrorBox, Textarea } from "./ui";

/** Anotaciones de la factura: salen en el PDF encima de la forma de pago. No tocan importes. */
export function AnnotationsCard({ invoice, readOnly }: { invoice: Invoice; readOnly: boolean }) {
  // Último texto guardado (se actualiza aquí mismo, sin recargar toda la factura).
  const [initial, setInitial] = useState(invoice.annotations ?? "");
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (readOnly) {
    if (!initial.trim()) return null;
    return (
      <Card>
        <CardTitle>Anotaciones</CardTitle>
        <p className="whitespace-pre-line text-muted-foreground">{initial}</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle description="Salen en el PDF de la factura, encima de la forma de pago.">Anotaciones</CardTitle>
      <ErrorBox error={error} />
      <Textarea
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="Ej.: Obra en Calle Mayor, 5 · Pedido nº 123"
        aria-label="Anotaciones"
      />
      <div className="mt-3 flex items-center gap-3">
        <Button
          variant="secondary"
          disabled={busy || text.trim() === initial.trim()}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await setInvoiceAnnotations(invoice.id, text);
              invoice.annotations = text.trim(); // para que «Ver PDF» use ya el texto nuevo
              setInitial(text.trim());
              setSaved(true);
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Save />
          {busy ? "Guardando…" : "Guardar anotaciones"}
        </Button>
        {saved ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
            <Check className="size-4" /> Guardado
          </span>
        ) : null}
      </div>
    </Card>
  );
}
