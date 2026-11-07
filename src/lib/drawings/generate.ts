import type { Drawing, DrawingParams, LeafType, Primitive } from "./types";

/** Tamaño máximo (en unidades del dibujo) del hueco; el resto es margen para las cotas. */
const BOX = 240;
const PAD = 6;
const DIM_RIGHT = 62;
const DIM_BOTTOM = 46;
const DIM_TEXT = 19;
const FRAME = 5;

const STROKE_FRAME = 1.6;
const STROKE = 0.9;
const STROKE_SYMBOL = 0.7;

interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
  type: LeafType;
}

const fmt = (n: number) => String(Math.round(n));

function arrow(x1: number, y: number, x2: number, sw: number): Primitive[] {
  const dir = x2 > x1 ? 1 : -1;
  const head = 6;
  return [
    { t: "line", x1, y1: y, x2, y2: y, sw },
    {
      t: "path",
      d: `M ${x2} ${y} L ${x2 - dir * head} ${y - head / 2} L ${x2 - dir * head} ${y + head / 2} Z`,
      sw,
      fill: "#000",
    },
  ];
}

function leafSymbol(c: Cell, isDoor: boolean): Primitive[] {
  const out: Primitive[] = [];
  const inset = c.type === "fijo" ? 0 : 3;
  const x0 = c.x + inset;
  const y0 = c.y + inset;
  const x1 = c.x + c.w - inset;
  const y1 = c.y + c.h - inset;
  const ym = (y0 + y1) / 2;
  const xm = (x0 + x1) / 2;

  if (c.type !== "fijo") out.push({ t: "rect", x: x0, y: y0, w: x1 - x0, h: y1 - y0, sw: STROKE });

  const handle = (side: "left" | "right") => {
    const hx = side === "left" ? x0 + 4 : x1 - 4;
    const hy = isDoor ? y0 + (y1 - y0) * 0.55 : ym;
    out.push({ t: "line", x1: hx, y1: hy - 6, x2: hx, y2: hy + 6, sw: 2 });
  };

  // Convención: el vértice del triángulo señala el lado de la maneta.
  const turnFromLeft = () => {
    out.push({ t: "line", x1: x0, y1: y0, x2: x1, y2: ym, sw: STROKE_SYMBOL, dash: true });
    out.push({ t: "line", x1: x0, y1: y1, x2: x1, y2: ym, sw: STROKE_SYMBOL, dash: true });
  };
  const turnFromRight = () => {
    out.push({ t: "line", x1: x1, y1: y0, x2: x0, y2: ym, sw: STROKE_SYMBOL, dash: true });
    out.push({ t: "line", x1: x1, y1: y1, x2: x0, y2: ym, sw: STROKE_SYMBOL, dash: true });
  };
  const tilt = () => {
    out.push({ t: "line", x1: x0, y1: y1, x2: xm, y2: y0, sw: STROKE_SYMBOL, dash: true });
    out.push({ t: "line", x1: x1, y1: y1, x2: xm, y2: y0, sw: STROKE_SYMBOL, dash: true });
  };

  switch (c.type) {
    case "izq":
      turnFromLeft();
      handle("right");
      break;
    case "dcha":
      turnFromRight();
      handle("left");
      break;
    case "oscilo-izq":
      turnFromLeft();
      tilt();
      handle("right");
      break;
    case "oscilo-dcha":
      turnFromRight();
      tilt();
      handle("left");
      break;
    case "abatible":
      tilt();
      break;
    case "corredera-izq": {
      const len = Math.min((x1 - x0) * 0.6, 60);
      out.push(...arrow(xm + len / 2, ym, xm - len / 2, 1));
      handle("right");
      break;
    }
    case "corredera-dcha": {
      const len = Math.min((x1 - x0) * 0.6, 60);
      out.push(...arrow(xm - len / 2, ym, xm + len / 2, 1));
      handle("left");
      break;
    }
    case "fijo":
      if (c.w > 14 && c.h > 14) out.push({ t: "text", x: xm, y: ym + 5, text: "F", size: 14, anchor: "middle" });
      break;
  }
  return out;
}

/**
 * Genera el dibujo de una ventana/puerta a partir de sus parámetros y medidas (mm).
 * Devuelve primitivas independientes del medio, que se pintan en SVG (web) o en el PDF.
 */
export function generateDrawing(p: DrawingParams, widthMm: number, heightMm: number): Drawing | null {
  if (p.kind === "ninguno") return null;
  const wMm = Math.max(widthMm || 0, 100);
  const hMm = Math.max(heightMm || 0, 100);
  const s = Math.min(BOX / wMm, BOX / hMm);
  const W = wMm * s;
  const H = hMm * s;
  const ox = PAD;
  const oy = PAD;
  const items: Primitive[] = [];
  const isDoor = p.kind === "puerta";

  // Marco
  items.push({ t: "rect", x: ox, y: oy, w: W, h: H, sw: STROKE_FRAME });
  const ix = ox + FRAME;
  const iy = oy + FRAME;
  const iw = W - 2 * FRAME;
  // En puertas no hay perfil inferior completo, solo umbral.
  const ih = isDoor ? H - FRAME - 1.5 : H - 2 * FRAME;
  items.push({ t: "rect", x: ix, y: iy, w: iw, h: ih, sw: STROKE });
  if (isDoor) {
    // Suelo
    items.push({ t: "line", x1: ox - 4, y1: oy + H, x2: ox + W + 4, y2: oy + H, sw: 2.2 });
  }

  // Reparto del hueco interior en zonas (proporcional a los mm).
  const clamp = (v: number, max: number) => Math.max(0, Math.min(v || 0, max));
  const topH = clamp(p.topFixedMm, hMm * 0.8) * s;
  const botH = clamp(p.bottomFixedMm, hMm * 0.8) * s;
  const leftW = clamp(p.sideLeftMm, wMm * 0.8) * s;
  const rightW = clamp(p.sideRightMm, wMm * 0.8) * s;

  const cells: Cell[] = [];
  const midY = iy + topH;
  const midH = Math.max(ih - topH - botH, 10);
  const midX = ix + leftW;
  const midW = Math.max(iw - leftW - rightW, 10);

  if (topH > 0) cells.push({ x: ix, y: iy, w: iw, h: topH, type: "fijo" });
  if (botH > 0) cells.push({ x: ix, y: midY + midH, w: iw, h: botH, type: "fijo" });
  if (leftW > 0) cells.push({ x: ix, y: midY, w: leftW, h: midH, type: "fijo" });
  if (rightW > 0) cells.push({ x: midX + midW, y: midY, w: rightW, h: midH, type: "fijo" });

  const leaves = p.leaves.length ? p.leaves : (["fijo"] as LeafType[]);
  const lw = midW / leaves.length;
  leaves.forEach((type, i) => cells.push({ x: midX + i * lw, y: midY, w: lw, h: midH, type }));

  for (const c of cells) {
    items.push({ t: "rect", x: c.x, y: c.y, w: c.w, h: c.h, sw: STROKE });
    items.push(...leafSymbol(c, isDoor));
  }

  // Cotas: ancho (abajo) y alto (derecha), en mm.
  const dy = oy + H + 16;
  items.push({ t: "line", x1: ox, y1: dy, x2: ox + W, y2: dy, sw: STROKE_SYMBOL });
  items.push({ t: "line", x1: ox, y1: dy - 4, x2: ox, y2: dy + 4, sw: STROKE_SYMBOL });
  items.push({ t: "line", x1: ox + W, y1: dy - 4, x2: ox + W, y2: dy + 4, sw: STROKE_SYMBOL });
  items.push({ t: "text", x: ox + W / 2, y: dy + 22, text: fmt(widthMm), size: DIM_TEXT, anchor: "middle" });

  const dx = ox + W + 14;
  items.push({ t: "line", x1: dx, y1: oy, x2: dx, y2: oy + H, sw: STROKE_SYMBOL });
  items.push({ t: "line", x1: dx - 4, y1: oy, x2: dx + 4, y2: oy, sw: STROKE_SYMBOL });
  items.push({ t: "line", x1: dx - 4, y1: oy + H, x2: dx + 4, y2: oy + H, sw: STROKE_SYMBOL });
  items.push({ t: "text", x: dx + 6, y: oy + H / 2 + 7, text: fmt(heightMm), size: DIM_TEXT, anchor: "start" });

  return { width: ox + W + DIM_RIGHT, height: oy + H + DIM_BOTTOM, items };
}
