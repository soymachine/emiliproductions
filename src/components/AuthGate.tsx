"use client";

import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { BrandMark } from "./Brand";
import { applyFavicon, applyTouchIcon, CompanyProvider, readCachedBrand } from "./CompanyContext";
import { firebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import { ensureInitialData } from "@/lib/db";
import { isViewerEmail } from "@/lib/access";
import { Button, Card, ErrorBox, Field, Input, Loading, Notice } from "./ui";

const UserContext = createContext<User | null>(null);
export const useUser = () => useContext(UserContext);
/** true si el usuario conectado es de solo consulta. */
export const useIsViewer = () => isViewerEmail(useContext(UserContext)?.email);

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(getFirebaseAuth(), async (u) => {
      if (u) {
        try {
          if (!isViewerEmail(u.email)) await ensureInitialData();
        } catch (e) {
          console.error(e);
        }
      }
      setUser(u);
    });
  }, []);

  if (!firebaseConfigured) return <NotConfigured />;
  if (user === undefined) return <Loading />;
  if (!user) return <Login />;
  return (
    <UserContext.Provider value={user}>
      <CompanyProvider>{children}</CompanyProvider>
    </UserContext.Provider>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logo: string } | null>(null);

  useEffect(() => {
    const b = readCachedBrand();
    setBrand(b);
    if (b?.logo) applyFavicon(b.logo);
    if (b) void applyTouchIcon(b.logo, b.name);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch {
      setError(new Error("Email o contraseña incorrectos."));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!email) return setError(new Error("Escribe tu email para recuperar la contraseña."));
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setInfo("Te hemos enviado un email para cambiar la contraseña.");
    } catch (e) {
      setError(e);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-background to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 flex size-20 items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-sm">
            <BrandMark logo={brand?.logo} name={brand?.name} className="size-full p-2 text-3xl" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">{brand?.name || "Presupuestos y facturas"}</h1>
          <p className="text-muted-foreground">Entra con tu cuenta</p>
        </div>
        <Card className="shadow-lg">
          <ErrorBox error={error} />
          {info ? <Notice>{info}</Notice> : null}
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Email">
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Contraseña">
              <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Button type="submit" disabled={busy} size="lg" className="mt-2">
              {busy ? "Entrando…" : "Entrar"}
            </Button>
            <button type="button" onClick={reset} className="text-sm font-medium text-primary hover:underline">
              He olvidado la contraseña
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-lg">
        <h1 className="mb-2 text-2xl font-bold">Falta configurar Firebase</h1>
        <p className="text-slate-600">
          Copia <code>.env.example</code> como <code>.env.local</code> y rellena los datos de tu proyecto Firebase. Consulta el README.
        </p>
      </Card>
    </div>
  );
}
