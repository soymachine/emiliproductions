"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, Inbox, Loader2, X } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Select as SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "md" | "lg" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  secondary: "bg-card text-foreground border border-border shadow-xs hover:bg-muted",
  outline: "border border-dashed border-input text-foreground hover:border-primary hover:bg-accent hover:text-accent-foreground",
  danger: "bg-card text-destructive border border-red-200 hover:bg-red-50",
  ghost: "text-primary hover:bg-accent",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-12 px-5",
  lg: "min-h-14 px-6 text-lg",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}

export function Field({ label, children, className = "", hint }: { label: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-card px-4 min-h-12 text-foreground shadow-xs transition-colors placeholder:text-muted-foreground hover:border-slate-400 focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputCls, className)} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "py-3", className)} rows={3} {...props} />;
}

export type SelectOption = { value: string; label: ReactNode };

/** Desplegable (shadcn/ui Select) con una lista sencilla de opciones. */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <SelectRoot value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border bg-card p-5 text-card-foreground shadow-xs sm:p-6", className)}>{children}</div>;
}

export function CardTitle({ children, description, action }: { children: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back ? (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      Cargando…
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div role="alert" className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
      <AlertCircle className="mt-0.5 size-5 shrink-0" />
      <span>{error instanceof Error ? error.message : String(error)}</span>
    </div>
  );
}

export function Notice({ children, tone = "success" }: { children: ReactNode; tone?: "success" | "info" }) {
  return (
    <div
      className={cn(
        "mb-4 rounded-lg border p-4",
        tone === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-blue-200 bg-blue-50 text-blue-900",
      )}
    >
      {children}
    </div>
  );
}

export function Empty({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-input bg-card/60 px-6 py-12 text-center text-muted-foreground">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-slate-500 [&_svg]:size-6">{icon ?? <Inbox />}</span>
      <div>{children}</div>
    </div>
  );
}

const badgeColors: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-700 ring-slate-200",
  enviado: "bg-blue-50 text-blue-700 ring-blue-200",
  aceptado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rechazado: "bg-red-50 text-red-700 ring-red-200",
  facturado: "bg-violet-50 text-violet-700 ring-violet-200",
  "sin facturar": "bg-slate-50 text-slate-600 ring-slate-200",
  pendiente: "bg-amber-50 text-amber-800 ring-amber-200",
  pagada: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const badgeDots: Record<string, string> = {
  borrador: "bg-slate-400",
  enviado: "bg-blue-500",
  aceptado: "bg-emerald-500",
  rechazado: "bg-red-500",
  facturado: "bg-violet-500",
  "sin facturar": "bg-slate-300",
  pendiente: "bg-amber-500",
  pagada: "bg-emerald-500",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset",
        badgeColors[status] ?? "bg-slate-100 ring-slate-200",
      )}
    >
      <span className={cn("size-1.5 rounded-full", badgeDots[status] ?? "bg-slate-400")} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border bg-card p-5 shadow-2xl sm:rounded-2xl sm:p-6",
          wide ? "max-w-5xl" : "max-w-2xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Fila clicable de un listado. */
export function ListRow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-muted/60">
        {children}
      </Link>
    </li>
  );
}

export function ListCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <ul className="divide-y">{children}</ul>
    </div>
  );
}
