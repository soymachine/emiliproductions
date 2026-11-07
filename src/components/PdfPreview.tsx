"use client";

import { Download, ExternalLink, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveBlob, type BuiltPdf } from "@/lib/pdf/download";
import { loadChunk } from "@/lib/chunks";
import { Button, Modal } from "./ui";

/**
 * Pinta cada página del PDF en un <canvas> con pdf.js. Así la vista previa se ve igual en todos los
 * navegadores (el visor integrado no existe en algunos y en el iPhone solo enseña la primera página).
 */
/** Carga pdf.js para pintar las páginas en el navegador. */
async function loadPdfJs() {
  // Versión «legacy»: compatible con Safari de iPad/iPhone más antiguos.
  const pdfjs = await loadChunk(() => import("pdfjs-dist/legacy/build/pdf.mjs"));
  // El «worker» de pdf.js se carga dentro de la propia página (sin Web Worker aparte):
  // así no depende de cómo cada navegador o el hosting sirvan ese fichero, que es lo que suele fallar en Safari.
  const g = globalThis as { pdfjsWorker?: unknown };
  if (!g.pdfjsWorker) g.pdfjsWorker = await loadChunk(() => import("pdfjs-dist/legacy/build/pdf.worker.min.mjs"));
  return pdfjs;
}

/**
 * Pinta cada página del PDF en un <canvas> con pdf.js, para que se vean todas las páginas en cualquier navegador.
 * Si no se puede, usa el visor de PDF del propio navegador.
 */
function PdfPages({ blob, url }: { blob: Blob; url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | Error>("loading");

  useEffect(() => {
    let cancelled = false;
    const container = ref.current;
    if (!container) return;
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({
          data: new Uint8Array(await blob.arrayBuffer()),
          // Opciones conservadoras: evitan APIs que no todos los Safari tienen.
          isOffscreenCanvasSupported: false,
          isImageDecoderSupported: false,
          useWorkerFetch: false,
        }).promise;
        container.replaceChildren();
        const width = container.clientWidth || 800;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelled) return;
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = "w-full rounded-md bg-white shadow-md ring-1 ring-black/5";
          canvas.setAttribute("aria-label", `Página ${n} de ${doc.numPages}`);
          canvas.setAttribute("role", "img");
          container.appendChild(canvas);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("El navegador no permite dibujar la página.");
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        }
        if (!cancelled) setState("ready");
        void doc.destroy();
      } catch (e) {
        console.error("Vista previa PDF:", e);
        if (!cancelled) setState(e instanceof Error ? e : new Error(String(e)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  if (state instanceof Error) {
    // Plan B: el visor de PDF integrado del navegador (Safari lo tiene).
    return (
      <div className="flex flex-col gap-2">
        <object data={url} type="application/pdf" className="h-[70vh] w-full rounded-lg border bg-muted" aria-label="Vista previa del PDF">
          <iframe src={url} title="Vista previa del PDF" className="h-[70vh] w-full rounded-lg border bg-muted" />
        </object>
        <p className="text-xs text-muted-foreground">
          Vista simplificada del navegador. Si no ves todas las páginas, usa «Abrir en pestaña nueva». (Detalle: {state.message || state.name})
        </p>
      </div>
    );
  }

  return (
    <div className="h-[70vh] overflow-y-auto rounded-lg border bg-slate-200/70 p-3 sm:p-5">
      {state === "loading" ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Preparando vista previa…
        </div>
      ) : null}
      <div ref={ref} className="mx-auto flex max-w-3xl flex-col gap-4" />
    </div>
  );
}

/** Vista previa de un PDF generado, con opción de descargarlo o abrirlo en otra pestaña. */
export function PdfPreview({ pdf, onClose }: { pdf: BuiltPdf; onClose: () => void }) {
  const url = useMemo(() => URL.createObjectURL(pdf.blob), [pdf.blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <Modal title={pdf.filename.replace(/\.pdf$/, "")} onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <PdfPages blob={pdf.blob} url={url} />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => window.open(url, "_blank")}>
            <ExternalLink />
            Abrir en pestaña nueva
          </Button>
          <Button variant="secondary" onClick={onClose}>
            <X />
            Cerrar
          </Button>
          <Button onClick={() => saveBlob(pdf.blob, pdf.filename)}>
            <Download />
            Descargar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
