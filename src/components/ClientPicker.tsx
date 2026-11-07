"use client";

import { useMemo, useState } from "react";
import { saveClient } from "@/lib/db";
import { matchesClient } from "@/lib/search";
import type { Client } from "@/lib/types";
import { ClientForm, EMPTY_CLIENT } from "./ClientForm";
import { Button, Input, Modal } from "./ui";

export function ClientPicker({
  clients,
  selectedId,
  onSelect,
  onCreated,
  disabled,
}: {
  clients: Client[];
  selectedId: string;
  onSelect: (c: Client) => void;
  onCreated: (c: Client) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(!selectedId);
  const [creating, setCreating] = useState(false);
  const selected = clients.find((c) => c.id === selectedId);
  const results = useMemo(() => clients.filter((c) => matchesClient(c, q)).slice(0, 8), [clients, q]);

  return (
    <div>
      {selected && !open ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold">{selected.name}</p>
            <p className="text-slate-600">
              {[selected.nif, selected.address, [selected.postalCode, selected.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}
            </p>
            <p className="text-slate-500">{[selected.phone, selected.email].filter(Boolean).join(" · ")}</p>
          </div>
          {!disabled ? (
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Cambiar cliente
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input placeholder="🔍 Buscar cliente por nombre, NIF, teléfono…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            <Button variant="secondary" onClick={() => setCreating(true)} className="shrink-0">
              ＋ Nuevo
            </Button>
          </div>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {results.length === 0 ? <li className="p-4 text-slate-500">No hay clientes que coincidan.</li> : null}
            {results.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center gap-x-4 px-4 py-3 text-left hover:bg-brand-50"
                  onClick={() => {
                    onSelect(c);
                    setOpen(false);
                    setQ("");
                  }}
                >
                  <span className="flex-1 font-semibold">{c.name}</span>
                  <span className="text-slate-500">{c.nif}</span>
                  <span className="text-slate-500">{c.city}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected ? (
            <button type="button" className="self-start text-brand-600 hover:underline" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          ) : null}
        </div>
      )}

      {creating ? (
        <Modal title="Nuevo cliente" onClose={() => setCreating(false)}>
          <ClientForm
            compact
            initial={{ ...EMPTY_CLIENT, name: q }}
            submitLabel="Crear y usar este cliente"
            onSubmit={async (input) => {
              const id = await saveClient(input);
              const now = Date.now();
              const c: Client = { ...input, id, createdAt: now, updatedAt: now };
              onCreated(c);
              setCreating(false);
              setOpen(false);
              setQ("");
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
