import type { DrawingParams } from "./types";

export type Pt = { x: number; y: number };

/** Longitud del lado inclinado de un fijo inclinado (mm). */
export function slopedLengthMm(baseMm: number, leftMm: number, rightMm: number): number {
  return Math.round(Math.hypot(baseMm || 0, (leftMm || 0) - (rightMm || 0)));
}

/** Lados del fijo inclinado, con valores por defecto si faltan (los dos iguales al alto). */
export function slopedSides(p: DrawingParams, heightMm: number): { left: number; right: number } {
  return { left: p.leftHeightMm || heightMm || 0, right: p.rightHeightMm || heightMm || 0 };
}

/**
 * Desplaza hacia dentro cada lado de un polígono convexo una distancia `d` y devuelve los nuevos
 * vértices (intersección de los lados desplazados). Sirve para dibujar el perfil del marco.
 */
export function insetPolygon(points: Pt[], d: number): Pt[] {
  const n = points.length;
  // Sentido del polígono: así sabemos hacia qué lado está «dentro».
  const area = points.reduce((s, p, i) => {
    const q = points[(i + 1) % n];
    return s + (p.x * q.y - q.x * p.y);
  }, 0);
  const sign = area > 0 ? 1 : -1;
  const lines = points.map((p, i) => {
    const q = points[(i + 1) % n];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    // Normal hacia dentro.
    const nx = (-dy / len) * sign;
    const ny = (dx / len) * sign;
    return { p: { x: p.x + nx * d, y: p.y + ny * d }, dir: { x: dx, y: dy } };
  });
  return lines.map((cur, i) => {
    const prev = lines[(i - 1 + n) % n];
    // Intersección de prev (p + t·dir) con cur (p + u·dir).
    const det = prev.dir.x * cur.dir.y - prev.dir.y * cur.dir.x;
    if (Math.abs(det) < 1e-9) return cur.p;
    const t = ((cur.p.x - prev.p.x) * cur.dir.y - (cur.p.y - prev.p.y) * cur.dir.x) / det;
    return { x: prev.p.x + prev.dir.x * t, y: prev.p.y + prev.dir.y * t };
  });
}

export function pathFrom(points: Pt[]): string {
  return points.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") + " Z";
}

/** Texto de medidas de una línea: «1300 × 2500 mm» o, en el fijo inclinado, base, lados e inclinado. */
export function measuresLabel(p: DrawingParams | undefined, widthMm: number, heightMm: number): string {
  if (p?.kind === "inclinado") {
    const { left, right } = slopedSides(p, heightMm);
    if (!widthMm || !left || !right) return "";
    return `Base ${widthMm} · Izq. ${left} · Dcha. ${right} · Inclinado ${slopedLengthMm(widthMm, left, right)} mm`;
  }
  return widthMm > 0 && heightMm > 0 ? `${widthMm} × ${heightMm} mm` : "";
}
