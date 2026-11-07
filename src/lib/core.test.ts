import { describe, expect, it } from "vitest";
import { applyDiscount, computeTotals, formatEuros, parseEurosToCents, parsePercent } from "./money";
import { addDaysIso, formatDate, formatDocNumber, isValidNumberFormat, rangePreset } from "./dates";
import { paidCentsOf, paymentsOf, pendingCentsOf, withPayment, withoutPayment } from "./payments";
import { generateDrawing } from "./drawings/generate";
import { DEFAULT_SETTINGS, drawing, fillQuoteNotes, SEED_ARTICLE_TYPES } from "./defaults";
import { decodeText, guessKind, guessMapping, planImport, rowsToClients, type ImportedClient } from "./import/clients";
import { matchesClient, nextClientCode } from "./search";

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
    expect(formatDocNumber("P-{AAAA}-{NNN}", 2026, 1)).toBe("P-2026-001");
    expect(formatDocNumber("F-{AAAA}-{NNN}", 2026, 1234)).toBe("F-2026-1234");
    expect(formatDocNumber("{AA}/{NNNN}", 2026, 123)).toBe("26/0123");
    expect(formatDocNumber("FAC{AAAA}{NNNNN}", 2027, 7)).toBe("FAC202700007");
    expect(formatDocNumber("F-", 2026, 5)).toBe("F-5");
    expect(isValidNumberFormat("F-{AAAA}-{NNN}")).toBe(true);
    expect(isValidNumberFormat("F-{AAAA}")).toBe(false);
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

  it("acota cada fijo y el hueco central además del total", () => {
    const texts = (d: ReturnType<typeof generateDrawing>) => d!.items.filter((i) => i.t === "text").map((i) => (i as { text: string }).text);
    const lados = texts(generateDrawing(drawing("ventana", ["corredera-dcha", "corredera-izq"], { sideLeftMm: 500, sideRightMm: 500 }), 2500, 1200));
    expect(lados).toEqual(expect.arrayContaining(["500", "1500", "2500", "1200"]));
    expect(lados.filter((t) => t === "500")).toHaveLength(2);
    const sup = texts(generateDrawing(drawing("puerta", ["izq"], { topFixedMm: 400 }), 900, 2500));
    expect(sup).toEqual(expect.arrayContaining(["400", "2100", "2500", "900"]));
    const sin = texts(generateDrawing(drawing("ventana", ["izq", "dcha"]), 1200, 1000)).filter((t) => /^\d+$/.test(t));
    expect(sin.sort()).toEqual(["1000", "1200"]);
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
    expect(m.nif).toBe(2);
    expect(m.code).toBe(0);
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

describe("código de cliente", () => {
  it("reconoce la columna de código sin confundirla con el nombre ni el código postal", () => {
    expect(guessMapping(["Nº Cliente", "N.I.F.", "Nombre"])).toMatchObject({ code: 0, nif: 1, name: 2 });
    const m = guessMapping(["Código cliente", "Nombre", "Cód. Postal", "Teléfono"]);
    expect(m.code).toBe(0);
    expect(m.name).toBe(1);
    expect(m.postalCode).toBe(2);
    const m2 = guessMapping(["Cliente", "Código Postal", "Código"]);
    expect(m2.code).toBe(2);
    expect(m2.name).toBe(0);
    expect(m2.postalCode).toBe(1);
  });

  it("normaliza los códigos que Excel convierte en decimales", () => {
    const [c] = rowsToClients([["123.0", "Ana"]], { code: 0, name: 1 });
    expect(c.code).toBe("123");
    const [d] = rowsToClients([["00042", "Luis"]], { code: 0, name: 1 });
    expect(d.code).toBe("00042");
  });

  it("propone el siguiente código", () => {
    expect(nextClientCode([])).toBe("1");
    expect(nextClientCode(["1", "7", "3"])).toBe("8");
    expect(nextClientCode(["0099", "0012"])).toBe("0100");
    expect(nextClientCode(["C-12", "", "40"])).toBe("41");
  });

  it("busca por código", () => {
    expect(matchesClient({ code: "1234", name: "Ana", nif: "", city: "", phone: "", email: "" }, "1234")).toBe(true);
  });

  it("al reimportar, añade el código a los existentes sin duplicarlos ni pisar datos", () => {
    const base = { kind: "particular" as const, address: "", postalCode: "", city: "", province: "", phone: "", phone2: "", email: "", notes: "" };
    const existing = [
      { ...base, id: "a", code: "", name: "Juan Pérez", nif: "12345678Z", phone: "600111222" },
      { ...base, id: "b", code: "", name: "Comunidad Calle Mayor", nif: "" },
      { ...base, id: "c", code: "77", name: "Ya Tiene Código", nif: "B11111111", city: "Valencia" },
    ];
    const imported: ImportedClient[] = [
      { ...base, code: "101", name: "JUAN PEREZ", nif: "12345678-z", phone: "999", city: "Xàtiva" },
      { ...base, code: "102", name: "comunidad calle mayor", nif: "" },
      { ...base, code: "77", name: "Ya Tiene Código", nif: "B11111111", city: "Otra" },
      { ...base, code: "103", name: "Nuevo Cliente", nif: "" },
      { ...base, code: "103", name: "Nuevo Cliente", nif: "" },
    ];
    const plan = planImport(imported, existing, "update");
    expect(plan.toCreate.map((c) => c.code)).toEqual(["103"]);
    expect(plan.toUpdate).toEqual([
      { id: "a", name: "Juan Pérez", patch: { code: "101", city: "Xàtiva" } },
      { id: "b", name: "Comunidad Calle Mayor", patch: { code: "102" } },
    ]);
    expect(plan.unchanged).toBe(2);

    const skip = planImport(imported, existing, "skip");
    expect(skip.toUpdate).toEqual([]);
    expect(skip.toCreate).toHaveLength(1);
  });
});

describe("observaciones por defecto", () => {
  it("rellena días e IBAN", () => {
    const t = fillQuoteNotes({ ...DEFAULT_SETTINGS, quoteValidityDays: 30, iban: "ES12 3456 7890 1234 5678 9012" });
    expect(t).toContain("Pressupost vàlid per 30 dies");
    expect(t.split("\n").at(-1)).toBe("ES12 3456 7890 1234 5678 9012");
  });
  it("deja un hueco visible si falta el IBAN", () => {
    expect(fillQuoteNotes({ ...DEFAULT_SETTINGS, iban: "" })).toContain("ESXX XXXX");
  });
});

describe("descuento", () => {
  it("rebaja cada precio y el total el mismo porcentaje", () => {
    const lines = [
      { quantity: 2, unitPriceCents: 45000 },
      { quantity: 1, unitPriceCents: 120000 },
    ];
    const d = applyDiscount(lines, 25);
    expect(d.map((l) => l.unitPriceCents)).toEqual([33750, 90000]);
    expect(computeTotals(d, 21).subtotalCents).toBe(computeTotals(lines, 21).subtotalCents * 0.75);
    expect(applyDiscount([{ unitPriceCents: 999 }], 12.5)[0].unitPriceCents).toBe(874);
  });
  it("rechaza porcentajes fuera de rango", () => {
    expect(() => applyDiscount([], 0)).toThrow();
    expect(() => applyDiscount([], -5)).toThrow();
    expect(() => applyDiscount([], 100)).toThrow();
    expect(parsePercent("25")).toBe(25);
    expect(parsePercent("12,5 %")).toBe(12.5);
    expect(parsePercent("0")).toBeNull();
    expect(parsePercent("abc")).toBeNull();
    expect(parsePercent("150")).toBeNull();
  });
});

describe("cobros de facturas", () => {
  const inv = { totalCents: 190575, status: "pendiente" as const, paidAt: null, payments: undefined };
  const pay = (id: string, date: string, amountCents: number) => ({ id, date, amountCents, method: "bizum" as const, note: "" });

  it("pasa de pendiente a parcial y a pagada", () => {
    const a = withPayment(inv, pay("1", "2026-11-07", 50000));
    expect(a.status).toBe("parcial");
    expect(a.paidAt).toBeNull();
    expect(pendingCentsOf({ ...inv, ...a })).toBe(140575);
    const b = withPayment({ ...inv, ...a }, pay("2", "2026-11-20", 140575));
    expect(b.status).toBe("pagada");
    expect(b.paidAt).toBe("2026-11-20");
    expect(b.paidCents).toBe(190575);
  });

  it("no deja cobrar de más ni importes vacíos", () => {
    expect(() => withPayment(inv, pay("1", "2026-11-07", 190576))).toThrow();
    expect(() => withPayment(inv, pay("1", "2026-11-07", 0))).toThrow();
  });

  it("al borrar un cobro vuelve a parcial", () => {
    const a = withPayment(inv, pay("1", "2026-11-07", 90575));
    const b = withPayment({ ...inv, ...a }, pay("2", "2026-11-08", 100000));
    const c = withoutPayment({ ...inv, ...b }, "2");
    expect(c.status).toBe("parcial");
    expect(c.paidCents).toBe(90575);
  });

  it("lee las facturas antiguas marcadas como pagadas", () => {
    const old = { totalCents: 1000, status: "pagada" as const, paidAt: "2026-05-01" };
    expect(paymentsOf(old)).toHaveLength(1);
    expect(paidCentsOf(old)).toBe(1000);
    expect(pendingCentsOf(old)).toBe(0);
  });
});

describe("rangos de fechas", () => {
  it("calcula los atajos", () => {
    expect(rangePreset("mes", "2026-11-07")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(rangePreset("trimestre", "2026-11-07")).toEqual({ from: "2026-10-01", to: "2026-12-31" });
    expect(rangePreset("trimestre", "2026-02-10")).toEqual({ from: "2026-01-01", to: "2026-03-31" });
    expect(rangePreset("año", "2026-11-07")).toEqual({ from: "2026-01-01", to: "2026-12-31" });
    expect(rangePreset("año-pasado", "2026-11-07")).toEqual({ from: "2025-01-01", to: "2025-12-31" });
    expect(rangePreset("mes", "2028-02-15").to).toBe("2028-02-29");
  });
});
