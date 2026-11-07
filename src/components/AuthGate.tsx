"use client";

import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { firebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import { ensureInitialData } from "@/lib/db";
import { Button, Card, ErrorBox, Field, Input, Loading } from "./ui";

const UserContext = createContext<User | null>(null);
export const useUser = () => useContext(UserContext);

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(getFirebaseAuth(), async (u) => {
      if (u) {
        try {
          await ensureInitialData();
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
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="mb-1 text-3xl font-bold text-brand-700">Presupuestos y facturas</h1>
        <p className="mb-6 text-slate-500">Entra con tu cuenta</p>
        <ErrorBox error={error} />
        {info ? <p className="mb-4 rounded-xl bg-green-50 p-4 text-green-800">{info}</p> : null}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Email">
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Contraseña">
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={busy} className="mt-2">
            {busy ? "Entrando…" : "Entrar"}
          </Button>
          <button type="button" onClick={reset} className="text-sm text-brand-600 hover:underline">
            He olvidado la contraseña
          </button>
        </form>
      </Card>
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
