"use client";

import { cn } from "@/lib/utils";

/** Logo de la empresa (el que se sube en Ajustes) o, si no hay, un icono con la inicial. */
export function BrandMark({ logo, name, className }: { logo?: string; name?: string; className?: string }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={name ? `Logo de ${name}` : "Logo"} className={cn("object-contain", className)} />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("flex items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground", className)}
    >
      {(name || "E").trim().charAt(0).toUpperCase()}
    </span>
  );
}
