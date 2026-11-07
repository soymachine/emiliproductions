"use client";

import { Download, ExternalLink, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveBlob, type BuiltPdf } from "@/lib/pdf/download";
import { loadChunk } from "@/lib/chunks";
import { Button, ErrorBox, Modal } from "./ui";

/**
 * Pinta cada página del PDF en un <canvas> con pdf.js. Así la vista previa se ve igual en todos los
 * navegadores (el visor integrado no existe en algunos y en el iPhone solo enseña la primera página).
 */
function PdfPages({ blob }: { blob: Blob }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | Error>("loading");

  useEffect(() => {
    let cancelled = false;
    const container = ref.current;
    if (!container) return;
    (async () => {
      try {
        // Versión «legacy» de pdf.js: compatible con Safari de iPad/iPhone algo más antiguos.
        const pdfjs = await loadChunk(() => import("pdfjs-dist/legacy/build/pdf.mjs"));
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        container.replaceChildren();
        const width = container.clientWidth || 800;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelled) return;
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "w-full rounded-md bg-white shadow-md ring-1 ring-black/5";
          canvas.setAttribute("aria-label", `Página ${n} de ${doc.numPages}`);
          canvas.setAttribute("role", "img");
          container.appendChild(canvas);
          await page.render({ canvas, viewport }).promise;
        }
        if (!cancelled) setState("ready");
        void doc.destroy();
      } catch (e) {
        if (!cancelled) setState(e instanceof Error ? e : new Error(String(e)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  return (
    <div className="h-[70vh] overflow-y-auto rounded-lg border bg-slate-200/70 p-3 sm:p-5">
      {state === "loading" ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Preparando vista previa…
        </div>
      ) : null}
      {state instanceof Error ? <ErrorBox error={new Error("No se pudo mostrar la vista previa. Puedes descargar el PDF igualmente.")} /> : null}
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
        <PdfPages blob={pdf.blob} />
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
