"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getSettings } from "@/lib/db";
import type { CompanySettings } from "@/lib/types";

interface Ctx {
  company: CompanySettings | null;
  refresh: () => Promise<void>;
}

const CompanyContext = createContext<Ctx>({ company: null, refresh: async () => {} });
export const useCompany = () => useContext(CompanyContext);

const CACHE_KEY = "emili:brand";

/** Nombre y logo guardados en el navegador para mostrarlos también en la pantalla de acceso. */
export function readCachedBrand(): { name: string; logo: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheBrand(c: CompanySettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ name: c.name, logo: c.logoDataUrl }));
  } catch {
    /* sin almacenamiento local: no pasa nada */
  }
}

/** Usa el logo como icono de la pestaña del navegador. */
export function applyFavicon(logo: string) {
  if (typeof document === "undefined") return;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = logo || "/icon.svg";
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanySettings | null>(null);

  const refresh = useCallback(async () => {
    try {
      const c = await getSettings();
      setCompany(c);
      cacheBrand(c);
      applyFavicon(c.logoDataUrl);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return <CompanyContext.Provider value={{ company, refresh }}>{children}</CompanyContext.Provider>;
}
