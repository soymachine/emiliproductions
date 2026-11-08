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

/**
 * Icono del acceso directo en la pantalla de inicio de iPad/iPhone: el logo de Ajustes centrado sobre
 * fondo blanco en un PNG de 180×180 (iOS no acepta SVG ni usa el favicon). Si no hay logo, se queda
 * el icono por defecto (/apple-touch-icon.png).
 */
export async function applyTouchIcon(logo: string, name?: string) {
  if (typeof document === "undefined") return;
  if (name) {
    let meta = document.querySelector<HTMLMetaElement>("meta[name='apple-mobile-web-app-title']");
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "apple-mobile-web-app-title";
      document.head.appendChild(meta);
    }
    meta.content = name.length > 18 ? name.slice(0, 18).trim() : name;
  }
  let link = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "apple-touch-icon";
    document.head.appendChild(link);
  }
  if (!logo) {
    link.href = "/apple-touch-icon.png";
    return;
  }
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("logo"));
      i.src = logo;
    });
    const size = 180;
    const pad = 18;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const k = Math.min((size - 2 * pad) / img.width, (size - 2 * pad) / img.height);
    const w = img.width * k;
    const h = img.height * k;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    link.href = canvas.toDataURL("image/png");
    link.setAttribute("sizes", "180x180");
  } catch {
    link.href = "/apple-touch-icon.png";
  }
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanySettings | null>(null);

  const refresh = useCallback(async () => {
    try {
      const c = await getSettings();
      setCompany(c);
      cacheBrand(c);
      applyFavicon(c.logoDataUrl);
      void applyTouchIcon(c.logoDataUrl, c.name);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return <CompanyContext.Provider value={{ company, refresh }}>{children}</CompanyContext.Provider>;
}
