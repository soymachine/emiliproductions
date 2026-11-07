"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { FileText, Home, LogOut, Receipt, Settings, SquareStack, Users } from "lucide-react";
import type { ReactNode } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { BrandMark } from "./Brand";
import { useCompany } from "./CompanyContext";
import { useUser } from "./AuthGate";

const NAV = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/presupuestos/", label: "Presupuestos", icon: FileText },
  { href: "/facturas/", label: "Facturas", icon: Receipt },
  { href: "/clientes/", label: "Clientes", icon: Users },
  { href: "/articulos/", label: "Artículos", icon: SquareStack },
  { href: "/ajustes/", label: "Ajustes", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() || "/";
  const { company } = useCompany();
  const user = useUser();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, "")));
  const name = company?.name ?? "";

  return (
    <div className="min-h-screen md:pl-64">
      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Link href="/" className="flex items-center gap-3 px-5 py-5">
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
            <BrandMark logo={company?.logoDataUrl} name={name} className="size-full p-1 text-lg" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-white">{name || "Gestión"}</span>
            <span className="block text-xs text-slate-400">Presupuestos y facturas</span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors",
                active(n.href) ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <n.icon className={cn("size-5", active(n.href) ? "text-blue-300" : "text-slate-400")} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-3 py-3">
          <p className="truncate px-3 pb-2 text-xs text-slate-400">{user?.email}</p>
          <button
            onClick={() => signOut(getFirebaseAuth())}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-5 text-slate-400" />
            Salir
          </button>
        </div>
      </aside>

      {/* Cabecera (móvil) */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
            <BrandMark logo={company?.logoDataUrl} name={name} className="size-full p-0.5" />
          </span>
          <span className="truncate font-semibold">{name || "Gestión"}</span>
        </Link>
        <Link href="/ajustes/" className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Ajustes">
          <Settings className="size-5" />
        </Link>
        <button onClick={() => signOut(getFirebaseAuth())} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Salir">
          <LogOut className="size-5" />
        </button>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-10 lg:px-10">{children}</main>

      {/* Barra inferior (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.filter((n) => n.href !== "/ajustes/").map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn("flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium", active(n.href) ? "text-primary" : "text-muted-foreground")}
          >
            <n.icon className="size-6" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
