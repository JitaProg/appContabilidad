import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseReceipt } from "./receipt-parser";

function fixture(name: string) {
  return readFileSync(
    fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url)),
    "utf8",
  );
}

describe("parseReceipt", () => {
  it("lee un ticket de Mercadona con total, fecha, NIF y artículos", () => {
    const result = parseReceipt(fixture("mercadona.txt"), 92);

    expect(result.merchant).toBe("Mercadona");
    expect(result.date).toBe("2026-11-03");
    expect(result.totalCents).toBe(2345);
    expect(result.totalConfidence).toBeGreaterThan(0.8);
    expect(result.nif).toBe("A46103834");
    expect(result.items.length).toBeGreaterThanOrEqual(6);
    expect(result.textConfidence).toBe(92);
    expect(result.warnings).toHaveLength(0);
  });

  it("prefiere TOTAL A PAGAR y no confunde el cambio ni la tarjeta", () => {
    const result = parseReceipt(fixture("restaurante.txt"));

    expect(result.merchant).toBe("Restaurante El Rincon");
    expect(result.date).toBe("2026-11-02");
    expect(result.totalCents).toBe(3800);
    expect(result.vat).toEqual([
      { rate: 10, baseCents: null, amountCents: 345 },
    ]);
  });

  it("encuentra el importe cuando el total está en la línea siguiente", () => {
    const result = parseReceipt(fixture("repsol.txt"));

    expect(result.merchant).toBe("Repsol");
    expect(result.totalCents).toBe(6150);
    expect(result.date).toBe("2026-11-01");
  });

  it("ignora TOTAL IVA y usa TOTAL COMPRA", () => {
    const result = parseReceipt(fixture("carrefour.txt"));

    expect(result.merchant).toBe("Carrefour");
    expect(result.totalCents).toBe(1210);
    expect(result.date).toBe("2026-10-28");
  });

  it("estima el total si no aparece la palabra TOTAL y avisa", () => {
    const result = parseReceipt(fixture("sin-total.txt"));

    expect(result.totalCents).toBe(230);
    expect(result.totalConfidence).toBeLessThan(0.5);
    expect(result.warnings.some((warning) => warning.includes("estimado"))).toBe(true);
    expect(result.date).toBe("2026-10-30");
  });

  it("no inventa un total si el texto está vacío", () => {
    const result = parseReceipt("");

    expect(result.totalCents).toBeNull();
    expect(result.items).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("no acepta fechas futuras", () => {
    const result = parseReceipt("TIENDA\nFECHA 01/01/2099\nTOTAL 10,00");
    expect(result.date).toBeNull();
  });

  it("convierte correctamente las fechas con dos dígitos de año", () => {
    const result = parseReceipt("TIENDA\nFECHA 05/02/26\nTOTAL 10,00");
    expect(result.date).toBe("2026-02-05");
  });
});
