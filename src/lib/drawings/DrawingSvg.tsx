import { generateDrawing } from "./generate";
import type { DrawingParams } from "./types";

export function DrawingSvg({
  params,
  widthMm,
  heightMm,
  className,
}: {
  params: DrawingParams;
  widthMm: number;
  heightMm: number;
  className?: string;
}) {
  const d = generateDrawing(params, widthMm, heightMm);
  if (!d) {
    return (
      <div className={`flex items-center justify-center text-sm text-slate-400 ${className ?? ""}`}>Sin dibujo</div>
    );
  }
  return (
    <svg
      viewBox={`0 0 ${d.width} ${d.height}`}
      className={className}
      role="img"
      aria-label={`Dibujo ${widthMm} x ${heightMm} mm`}
    >
      {d.items.map((it, i) => {
        switch (it.t) {
          case "rect":
            return (
              <rect key={i} x={it.x} y={it.y} width={it.w} height={it.h} fill={it.fill ?? "none"} stroke="currentColor" strokeWidth={it.sw} />
            );
          case "line":
            return (
              <line
                key={i}
                x1={it.x1}
                y1={it.y1}
                x2={it.x2}
                y2={it.y2}
                stroke="currentColor"
                strokeWidth={it.sw}
                strokeDasharray={it.dash ? "4 3" : undefined}
              />
            );
          case "path":
            // Las flechas (#000) siguen el color del texto; el resto de rellenos usan su color.
            return <path key={i} d={it.d} fill={!it.fill ? "none" : it.fill === "#000" ? "currentColor" : it.fill} stroke="currentColor" strokeWidth={it.sw} />;
          case "text":
            return (
              <text key={i} x={it.x} y={it.y} fontSize={it.size} textAnchor={it.anchor} fill="currentColor" fontFamily="Helvetica, Arial, sans-serif">
                {it.text}
              </text>
            );
        }
      })}
    </svg>
  );
}
