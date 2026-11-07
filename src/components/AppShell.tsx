"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import type { ReactNode } from "react";
import { getFirebaseAuth } from "@/lib/firebase";

const NAV = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/presupuestos/", label: "Presupuestos", icon: "📝" },
  { href: "/facturas/", label: "Facturas", icon: "💶" },
  { href: "/clientes/", label: "Clientes", icon: "👥" },
  { href: "/articulos/", label: "Artículos", icon: "🪟" },
  { href: "/ajustes/", label: "Ajustes", icon: "⚙️" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() || "/";
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, "")));

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="text-xl font-bold text-brand-700">
            Emili · Gestión
          </Link>
          <nav className="hidden flex-1 gap-1 md:flex">
            {NAV.slice(1).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-xl px-4 py-2 font-semibold ${active(n.href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button onClick={() => signOut(getFirebaseAuth())} className="ml-auto text-sm text-slate-500 hover:text-slate-800">
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      {/* Barra inferior en el móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden">
        {NAV.filter((n) => n.href !== "/ajustes/").map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-col items-center py-2 text-xs font-semibold ${active(n.href) ? "text-brand-600" : "text-slate-500"}`}
          >
            <span className="text-xl" aria-hidden>
              {n.icon}
            </span>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
