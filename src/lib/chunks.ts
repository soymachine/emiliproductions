"use client";

const FLAG = "emili:chunk-reload";

/** ¿Es el error de «falta un trozo de la app» que aparece tras publicar una versión nueva? */
export function isChunkLoadError(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  return /ChunkLoadError|Failed to load chunk|Loading chunk .* failed|Importing a module script failed|error loading dynamically imported module/i.test(msg);
}

/**
 * Carga una parte de la app bajo demanda. Si la pestaña es de una versión anterior (se ha publicado
 * una nueva y el fichero ya no existe), recarga la página una vez para coger la versión nueva.
 */
export async function loadChunk<T>(load: () => Promise<T>): Promise<T> {
  try {
    const mod = await load();
    try {
      sessionStorage.removeItem(FLAG);
    } catch {}
    return mod;
  } catch (e) {
    if (!isChunkLoadError(e)) throw e;
    let reloaded = false;
    try {
      reloaded = sessionStorage.getItem(FLAG) === "1";
      if (!reloaded) sessionStorage.setItem(FLAG, "1");
    } catch {}
    if (!reloaded) {
      window.location.reload();
      // La página se recarga; esta promesa no se resuelve.
      return new Promise<T>(() => {});
    }
    throw new Error("Hay una versión nueva de la app. Recarga la página (o cierra y vuelve a abrir la pestaña) y vuelve a intentarlo.");
  }
}
