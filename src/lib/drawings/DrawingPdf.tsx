import { Line, Path, Rect, Svg, Text } from "@react-pdf/renderer";
import { generateDrawing } from "./generate";
import type { DrawingParams } from "./types";

/** Mismo dibujo que DrawingSvg pero con las primitivas de @react-pdf/renderer. */
export function DrawingPdf({
  params,
  widthMm,
  heightMm,
  size,
}: {
  params: DrawingParams;
  widthMm: number;
  heightMm: number;
  /** Lado máximo en puntos PDF. */
  size: number;
}) {
  const d = generateDrawing(params, widthMm, heightMm);
  if (!d) return null;
  const k = size / Math.max(d.width, d.height);
  return (
    <Svg width={d.width * k} height={d.height * k} viewBox={`0 0 ${d.width} ${d.height}`}>
      {d.items.map((it, i) => {
        switch (it.t) {
          case "rect":
            return <Rect key={i} x={it.x} y={it.y} width={it.w} height={it.h} fill={it.fill ?? "none"} stroke="#000" strokeWidth={it.sw} />;
          case "line":
            return (
              <Line
                key={i}
                x1={it.x1}
                y1={it.y1}
                x2={it.x2}
                y2={it.y2}
                stroke="#000"
                strokeWidth={it.sw}
                strokeDasharray={it.dash ? "4 3" : undefined}
              />
            );
          case "path":
            return <Path key={i} d={it.d} fill={it.fill ?? "none"} stroke="#000" strokeWidth={it.sw} />;
          case "text":
            return (
              <Text key={i} x={it.x} y={it.y} textAnchor={it.anchor} fill="#000" style={{ fontSize: it.size, fontFamily: "Helvetica" }}>
                {it.text}
              </Text>
            );
        }
      })}
    </Svg>
  );
}
