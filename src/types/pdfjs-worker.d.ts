// El worker de pdf.js no trae tipos; solo se importa para registrarlo en la página.
declare module "pdfjs-dist/legacy/build/pdf.worker.min.mjs" {
  export const WorkerMessageHandler: unknown;
}
