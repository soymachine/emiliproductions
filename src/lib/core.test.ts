import { describe, expect, it } from "vitest";
import { computeTotals, formatEuros, parseEurosToCents } from "./money";
import { addDaysIso, formatDate, formatDocNumber } from "./dates";
import { generateDrawing } from "./drawings/generate";
import { drawing, SEED_ARTICLE_TYPES } from "./defaults";
import { decodeText, guessKind, guessMapping, rowsToClients } from "./import/clients";

describe("money", () => {
  it("parsea importes escritos en formato español e inglés", () => {
    expect(parseEurosToCents("1.234,56")).toBe(123456);
    expect(parseEurosToCents("1234,5")).toBe(123450);
    expect(parseEurosToCents("1234.56")).toBe(123456);
    expect(parseEurosToCents("1.234")).toBe(123400);
    expect(parseEurosToCents("99 €")).toBe(9900);
    expect(parseEurosToCents("abc")).toBeNull();
    expect(parseEurosToCents("")).toBeNull();
  });

  it("calcula totales con IVA redondeando en céntimos", () => {
    const t = computeTotals(
      [
        { quantity: 2, unitPriceCents: 45050 },
        { quantity: 1, unitPriceCents: 12033 },
      ],
      21,
    );
    expect(t.subtotalCents).toBe(102133);
    expect(t.vatCents).toBe(21448); // 21447.93
    expect(t.totalCents).toBe(123581);
    expect(computeTotals([{ quantity: 3, unitPriceCents: 10000 }], 10).totalCents).toBe(33000);
  });

  it("formatea euros", () => {
    expect(formatEuros(123456).replace(/\s/g, " ")).toBe("1.234,56 €");
  });
});

describe("fechas y numeración", () => {
  it("numera correlativamente", () => {
    expect(formatDocNumber("P", 2026, 1)).toBe("P-2026-001");
    expect(formatDocNumber("F", 2026, 1234)).toBe("F-2026-1234");
  });
  it("suma días y formatea", () => {
    expect(addDaysIso("2026-12-20", 30)).toBe("2027-01-19");
    expect(formatDate("2026-11-07")).toBe("07/11/2026");
  });
});

describe("dibujos", () => {
  it("genera todas las plantillas del catálogo inicial", () => {
    for (const a of SEED_ARTICLE_TYPES) {
      const d = generateDrawing(a.drawing, a.defaultWidthMm, a.defaultHeightMm);
      if (a.drawing.kind === "ninguno") expect(d).toBeNull();
      else {
        expect(d!.items.length).toBeGreaterThan(5);
        for (const it of d!.items) {
          for (const v of Object.values(it)) if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
        }
      }
    }
  });

  it("incluye las cotas en mm", () => {
    const d = generateDrawing(drawing("ventana", ["corredera-dcha", "corredera-izq"]), 2000, 1200)!;
    const texts = d.items.filter((i) => i.t === "text").map((i) => (i as { text: string }).text);
    expect(texts).toContain("2000");
    expect(texts).toContain("1200");
  });

  it("respeta la proporción de las medidas", () => {
    const d = generateDrawing(drawing("ventana", ["fijo"]), 2000, 1000)!;
    const frame = d.items[0] as { w: number; h: number };
    expect(frame.w / frame.h).toBeCloseTo(2);
  });
});

describe("importación de clientes", () => {
  it("adivina el mapeo de columnas", () => {
    const m = guessMapping(["Código", "Razón Social", "C.I.F.", "Dirección", "C.P.", "Población", "Provincia", "Teléfono", "Teléfono 2", "E-mail"]);
    expect(m.name).toBe(1);
    expect(m.address).toBe(3);
    expect(m.postalCode).toBe(4);
    expect(m.city).toBe(5);
    expect(m.phone).toBe(7);
    expect(m.phone2).toBe(8);
    expect(m.email).toBe(9);
  });

  it("convierte filas y descarta las vacías", () => {
    const clients = rowsToClients(
      [
        ["Juan Pérez", "12345678z", "Calle 1"],
        ["", "", ""],
        ["Reformas Sol S.L.", "B12345678", "Av. 2"],
      ],
      { name: 0, nif: 1, address: 2 },
    );
    expect(clients).toHaveLength(2);
    expect(clients[0].nif).toBe("12345678Z");
    expect(clients[0].kind).toBe("particular");
    expect(clients[1].kind).toBe("empresa");
  });

  it("detecta empresas", () => {
    expect(guessKind("B12345678", "x")).toBe("empresa");
    expect(guessKind("", "Aluminios García S.L.")).toBe("empresa");
    expect(guessKind("12345678Z", "Ana")).toBe("particular");
  });

  it("decodifica CSV en Windows-1252", () => {
    const bytes = new Uint8Array([0x50, 0xe9, 0x72, 0x65, 0x7a]); // "Pérez" en latin1
    expect(decodeText(bytes.buffer)).toBe("Pérez");
    expect(decodeText(new TextEncoder().encode("Pérez").buffer as ArrayBuffer)).toBe("Pérez");
  });
});
