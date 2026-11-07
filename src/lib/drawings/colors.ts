/** Colores de marco disponibles. `fill` es el color con el que se pinta el perfil en el dibujo. */
export interface FrameColor {
  id: string;
  name: string;
  /** Referencia (RAL, acabado…) que se muestra entre paréntesis. */
  ref?: string;
  fill: string;
  group: "Básicos" | "Metalizados" | "Imitación madera";
}

export const FRAME_COLORS: FrameColor[] = [
  { id: "blanco", name: "Blanco", ref: "RAL 9016", fill: "#ffffff", group: "Básicos" },
  { id: "negro", name: "Negro", ref: "RAL 9005", fill: "#1f2328", group: "Básicos" },
  { id: "plata", name: "Plata", ref: "anodizado", fill: "#c4cad0", group: "Básicos" },
  { id: "antracita", name: "Antracita", ref: "RAL 7016", fill: "#383e42", group: "Básicos" },
  { id: "gris", name: "Gris", ref: "RAL 9006", fill: "#a5a8a6", group: "Básicos" },
  { id: "bronce", name: "Bronce", fill: "#6f5a3e", group: "Metalizados" },
  { id: "inox", name: "Acero inoxidable", fill: "#b9bec2", group: "Metalizados" },
  { id: "roble", name: "Roble", ref: "imitación madera", fill: "#b07a43", group: "Imitación madera" },
  { id: "nogal", name: "Nogal", ref: "imitación madera", fill: "#5e3b22", group: "Imitación madera" },
];

export function frameColor(id: string | undefined | null): FrameColor | undefined {
  return id ? FRAME_COLORS.find((c) => c.id === id) : undefined;
}

/** «Antracita (RAL 7016)»; cadena vacía si no hay color. */
export function frameColorLabel(id: string | undefined | null): string {
  const c = frameColor(id);
  return c ? (c.ref ? `${c.name} (${c.ref})` : c.name) : "";
}
