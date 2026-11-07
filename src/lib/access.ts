/**
 * Usuarios de solo consulta: ven presupuestos y facturas y descargan sus PDF, pero no pueden
 * cambiar nada ni crear presupuestos. Para añadir uno:
 *   1. Créalo en Firebase Authentication (email y contraseña).
 *   2. Añade su email, en minúsculas, aquí Y en la función isViewer() de firestore.rules.
 *   3. Publica con `npm run deploy`.
 * Cualquier otra cuenta con acceso (las de isOwner() en firestore.rules) tiene acceso completo.
 */
export const VIEWER_EMAILS: string[] = ["emiliomateotorreblanca@gmail.com"];

export function isViewerEmail(email: string | null | undefined): boolean {
  return Boolean(email) && VIEWER_EMAILS.includes(email!.trim().toLowerCase());
}

/** Secciones que puede abrir un usuario de consulta. */
export const VIEWER_SECTIONS = ["/presupuestos", "/facturas"];
