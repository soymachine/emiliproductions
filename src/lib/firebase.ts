"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signOut, type Auth } from "firebase/auth";
import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  type Firestore,
} from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === "1";

export const firebaseConfigured = Boolean((config.apiKey && config.projectId) || useEmulators);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function init() {
  if (app) return;
  app =
    getApps()[0] ??
    initializeApp(useEmulators ? { apiKey: "demo-key", projectId: config.projectId || "demo-emili", authDomain: "localhost" } : config);
  auth = getAuth(app);
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    // Caché local: la app va rápida y aguanta cortes de cobertura en obra.
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  if (useEmulators) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
}

export function getFirebaseAuth(): Auth {
  init();
  return auth!;
}

export function getDb(): Firestore {
  init();
  return db!;
}

/**
 * Cierra la sesión y borra la copia local de los datos (caché de Firestore en IndexedDB),
 * para que no queden clientes ni facturas guardados en el navegador del dispositivo.
 */
export async function logout(): Promise<void> {
  init();
  try {
    await signOut(auth!);
  } finally {
    try {
      await terminate(db!);
      await clearIndexedDbPersistence(db!);
    } catch (e) {
      console.warn("No se pudo borrar la caché local", e);
    }
    window.location.replace("/");
  }
}
