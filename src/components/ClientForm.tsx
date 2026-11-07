"use client";

import { Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Client } from "@/lib/types";
import { Button, Field, Input, Select, Textarea } from "./ui";

export type ClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;

export const EMPTY_CLIENT: ClientInput = {
  code: "",
  kind: "particular",
  name: "",
  nif: "",
  address: "",
  postalCode: "",
  city: "",
  province: "",
  phone: "",
  phone2: "",
  email: "",
  notes: "",
};

export function ClientForm({
  initial,
  onSubmit,
  submitLabel = "Guardar cliente",
  compact = false,
  takenCodes,
}: {
  initial: ClientInput;
  onSubmit: (c: ClientInput) => Promise<void>;
  submitLabel?: string;
  compact?: boolean;
  /** Códigos ya usados por otros clientes (código → nombre), para avisar de repetidos. */
  takenCodes?: Map<string, string>;
}) {
  const [c, setC] = useState<ClientInput>({ ...initial, code: initial.code ?? "" });
  const duplicateOf = c.code.trim() ? takenCodes?.get(c.code.trim()) : undefined;
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ClientInput>(k: K, v: ClientInput[K]) => setC((prev) => ({ ...prev, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (duplicateOf) return;
    setBusy(true);
    try {
      await onSubmit({ ...c, code: c.code.trim(), nif: c.nif.toUpperCase().trim(), name: c.name.trim() });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-6">
      <Field label="Código de cliente" className="sm:col-span-2" hint={duplicateOf ? undefined : "Se propone el siguiente libre; puedes cambiarlo."}>
        <Input
          value={c.code}
          onChange={(e) => set("code", e.target.value)}
          className={duplicateOf ? "border-destructive font-mono focus:border-destructive" : "font-mono"}
          aria-invalid={Boolean(duplicateOf)}
        />
        {duplicateOf ? <span className="text-sm text-destructive">Este código ya lo tiene «{duplicateOf}».</span> : null}
      </Field>
      <Field label="Tipo" className="sm:col-span-4">
        <Select
          value={c.kind}
          onValueChange={(v) => set("kind", v as ClientInput["kind"])}
          options={[
            { value: "particular", label: "Particular" },
            { value: "empresa", label: "Empresa / Autónomo" },
          ]}
        />
      </Field>
      <Field label={c.kind === "empresa" ? "Razón social *" : "Nombre y apellidos *"} className="sm:col-span-6">
        <Input value={c.name} onChange={(e) => set("name", e.target.value)} required autoFocus={!initial.name} />
      </Field>
      <Field label="NIF / CIF" className="sm:col-span-2">
        <Input value={c.nif} onChange={(e) => set("nif", e.target.value)} />
      </Field>
      <Field label="Teléfono" className="sm:col-span-2">
        <Input type="tel" value={c.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <Field label="Teléfono 2" className="sm:col-span-2">
        <Input type="tel" value={c.phone2} onChange={(e) => set("phone2", e.target.value)} />
      </Field>
      <Field label="Email" className="sm:col-span-6">
        <Input type="email" value={c.email} onChange={(e) => set("email", e.target.value)} />
      </Field>
      <Field label="Dirección" className="sm:col-span-6">
        <Input value={c.address} onChange={(e) => set("address", e.target.value)} />
      </Field>
      <Field label="Código postal" className="sm:col-span-2">
        <Input inputMode="numeric" value={c.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
      </Field>
      <Field label="Población" className="sm:col-span-2">
        <Input value={c.city} onChange={(e) => set("city", e.target.value)} />
      </Field>
      <Field label="Provincia" className="sm:col-span-2">
        <Input value={c.province} onChange={(e) => set("province", e.target.value)} />
      </Field>
      {!compact ? (
        <Field label="Notas" className="sm:col-span-6">
          <Textarea value={c.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      ) : null}
      <div className="sm:col-span-6">
        <Button type="submit" disabled={busy || !c.name.trim() || Boolean(duplicateOf)}>
          <Save />
          {busy ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
