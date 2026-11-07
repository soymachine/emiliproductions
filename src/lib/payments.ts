import type { Invoice, InvoiceStatus, Payment, PaymentMethod } from "./types";

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  bizum: "Bizum",
  otro: "Otro",
};

type PaymentFields = Pick<Invoice, "totalCents" | "status" | "paidAt" | "payments">;

/**
 * Cobros de una factura. Las facturas marcadas como pagadas antes de existir los cobros parciales
 * se leen como un único cobro por el total en su fecha de pago.
 */
export function paymentsOf(inv: PaymentFields): Payment[] {
  if (inv.payments) return inv.payments;
  if (inv.status === "pagada") {
    return [{ id: "anterior", date: inv.paidAt ?? "", amountCents: inv.totalCents, method: "otro", note: "" }];
  }
  return [];
}

export function paidCentsOf(inv: PaymentFields): number {
  return paymentsOf(inv).reduce((s, p) => s + p.amountCents, 0);
}

export function pendingCentsOf(inv: PaymentFields): number {
  return Math.max(0, inv.totalCents - paidCentsOf(inv));
}

export function statusFor(totalCents: number, paidCents: number): InvoiceStatus {
  if (paidCents <= 0) return "pendiente";
  return paidCents >= totalCents ? "pagada" : "parcial";
}

export type PaymentPatch = Pick<Invoice, "status" | "paidAt"> & { payments: Payment[]; paidCents: number };

function patchFor(totalCents: number, payments: Payment[]): PaymentPatch {
  const sorted = [...payments].sort((a, b) => a.date.localeCompare(b.date));
  const paidCents = sorted.reduce((s, p) => s + p.amountCents, 0);
  const status = statusFor(totalCents, paidCents);
  return { payments: sorted, paidCents, status, paidAt: status === "pagada" ? sorted[sorted.length - 1]?.date ?? null : null };
}

/** Añade un cobro. No permite importes ≤ 0 ni cobrar más de lo pendiente. */
export function withPayment(inv: PaymentFields, p: Payment): PaymentPatch {
  if (!Number.isInteger(p.amountCents) || p.amountCents <= 0) throw new Error("El importe del cobro tiene que ser mayor que 0.");
  if (!p.date) throw new Error("Indica la fecha del cobro.");
  const pending = pendingCentsOf(inv);
  if (p.amountCents > pending) throw new Error("El cobro es mayor que lo que queda pendiente de esta factura.");
  return patchFor(inv.totalCents, [...paymentsOf(inv), p]);
}

export function withoutPayment(inv: PaymentFields, paymentId: string): PaymentPatch {
  return patchFor(
    inv.totalCents,
    paymentsOf(inv).filter((p) => p.id !== paymentId),
  );
}
