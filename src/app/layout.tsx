import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Emili · Presupuestos y facturas",
  description: "Gestión de clientes, presupuestos y facturas de carpintería metálica",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
  // Al abrirla desde el icono de la pantalla de inicio del iPad/iPhone, a pantalla completa.
  appleWebApp: { capable: true, title: "Emili", statusBarStyle: "default" },
  // iPadOS/iOS antiguos solo entienden la etiqueta clásica de Apple.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f172a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <AuthGate>
          <AppShell>{children}</AppShell>
        </AuthGate>
      </body>
    </html>
  );
}
