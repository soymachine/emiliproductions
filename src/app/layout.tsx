import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Emili · Presupuestos y facturas",
  description: "Gestión de clientes, presupuestos y facturas de carpintería metálica",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1e3a5f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthGate>
          <AppShell>{children}</AppShell>
        </AuthGate>
      </body>
    </html>
  );
}
