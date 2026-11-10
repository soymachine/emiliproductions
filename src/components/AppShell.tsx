"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, LogOut, Receipt, Settings, SquareStack, Users } from "lucide-react";
import type { ReactNode } from "react";
import { logout } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { BrandMark } from "./Brand";
import { useCompany } from "./CompanyContext";
import { useIsViewer, useUser } from "./AuthGate";
import { VIEWER_SECTIONS } from "@/lib/access";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
  const viewer = useIsViewer();
  const router = useRouter();
  const nav = viewer ? NAV.filter((n) => VIEWER_SECTIONS.some((s) => n.href.startsWith(s))) : NAV;
  const allowed = !viewer || VIEWER_SECTIONS.some((s) => path.startsWith(s));

  // Un usuario de consulta solo puede estar en Presupuestos y Facturas.
  useEffect(() => {
    if (!allowed) router.replace("/presupuestos/");
  }, [allowed, router]);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Barra lateral (escritorio) */}
      {/* Barra lateral: sticky con el alto visible real (dvh), para que en el iPad no se corte al hacer scroll. */}
      <aside className="sticky top-0 z-30 hidden h-dvh w-64 flex-col overflow-y-auto overscroll-contain bg-sidebar text-sidebar-foreground md:flex">
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
          {nav.map((n) => (
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
            onClick={() => logout()}
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
        {!viewer ? (
          <Link href="/ajustes/" className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Ajustes">
            <Settings className="size-5" />
          </Link>
        ) : (
          <span className="ml-auto" />
        )}
        <button onClick={() => logout()} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Salir">
          <LogOut className="size-5" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-10 lg:px-10">{allowed ? children : null}</main>

      {/* Barra inferior (móvil) */}
      <nav className={cn("fixed inset-x-0 bottom-0 z-20 grid border-t", viewer ? "grid-cols-2" : "grid-cols-5", " bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden")}>
        {(viewer ? nav : NAV.filter((n) => n.href !== "/ajustes/")).map((n) => (
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
