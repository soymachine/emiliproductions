/**
 * Tipo de cada hoja del dibujo.
 * - "izq" / "dcha": practicable con bisagras a la izquierda / derecha.
 * - "oscilo-izq" / "oscilo-dcha": oscilobatiente (practicable + abatible hacia dentro).
 * - "abatible": solo abatible (bisagras abajo).
 * - "corredera-izq" / "corredera-dcha": hoja corredera que se desplaza hacia ese lado.
 * - "fijo": hoja fija.
 */
export type LeafType =
  | "izq"
  | "dcha"
  | "oscilo-izq"
  | "oscilo-dcha"
  | "abatible"
  | "corredera-izq"
  | "corredera-dcha"
  | "fijo";

/** «inclinado»: fijo con forma de trapecio (p. ej. para escaleras), con un lado superior o inferior inclinado. */
export type DrawingKind = "ventana" | "puerta" | "inclinado" | "ninguno";

export interface DrawingParams {
  kind: DrawingKind;
  leaves: LeafType[];
  /** Altura en mm del fijo superior (0 = sin fijo). */
  topFixedMm: number;
  /** Altura en mm del fijo inferior (0 = sin fijo). */
  bottomFixedMm: number;
  /** Anchura en mm del fijo lateral izquierdo (0 = sin fijo). */
  sideLeftMm: number;
  /** Anchura en mm del fijo lateral derecho (0 = sin fijo). */
  sideRightMm: number;
  /** Color del marco (id de FRAME_COLORS). Sin valor: blanco, como siempre. */
  frameColor?: string;
  /** Fijo inclinado: altura del lado izquierdo y del derecho en mm (la base es el ancho de la línea). */
  leftHeightMm?: number;
  rightHeightMm?: number;
  /** Fijo inclinado: qué lado va inclinado (por defecto «arriba», con la base recta abajo). */
  slope?: "arriba" | "abajo";
}

export type Primitive =
  | { t: "rect"; x: number; y: number; w: number; h: number; sw: number; fill?: string }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; sw: number; dash?: boolean }
  | { t: "path"; d: string; sw: number; fill?: string }
  | { t: "text"; x: number; y: number; text: string; size: number; anchor: "start" | "middle" | "end" };

export interface Drawing {
  width: number;
  height: number;
  items: Primitive[];
}

export const LEAF_LABELS: Record<LeafType, string> = {
  izq: "Practicable (bisagras izq.)",
  dcha: "Practicable (bisagras dcha.)",
  "oscilo-izq": "Oscilobatiente (bisagras izq.)",
  "oscilo-dcha": "Oscilobatiente (bisagras dcha.)",
  abatible: "Abatible",
  "corredera-izq": "Corredera ←",
  "corredera-dcha": "Corredera →",
  fijo: "Fijo",
};

export const KIND_LABELS: Record<DrawingKind, string> = {
  ventana: "Ventana",
  puerta: "Puerta",
  inclinado: "Fijo inclinado",
  ninguno: "Sin dibujo",
};
