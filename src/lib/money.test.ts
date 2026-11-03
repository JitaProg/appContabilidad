import { describe, expect, it } from "vitest";
import { centsToInput, formatEUR, parseAmountToCents } from "./money";

describe("parseAmountToCents", () => {
  it("interpreta la coma decimal española", () => {
    expect(parseAmountToCents("23,45")).toBe(2345);
    expect(parseAmountToCents("0,99")).toBe(99);
    expect(parseAmountToCents("23,45 €")).toBe(2345);
    expect(parseAmountToCents(" 12,5 ")).toBe(1250);
  });

  it("interpreta miles con punto y decimal con coma", () => {
    expect(parseAmountToCents("1.234,56")).toBe(123456);
    expect(parseAmountToCents("12.345,6")).toBe(1234560);
  });

  it("interpreta el punto como decimal si no es separador de miles", () => {
    expect(parseAmountToCents("23.45")).toBe(2345);
    expect(parseAmountToCents("1.234")).toBe(123400);
  });

  it("devuelve null con entradas sin número", () => {
    expect(parseAmountToCents("")).toBeNull();
    expect(parseAmountToCents("abc")).toBeNull();
    expect(parseAmountToCents(null)).toBeNull();
  });

  it("redondea a céntimos", () => {
    expect(parseAmountToCents("0,005")).toBe(1);
    expect(parseAmountToCents("10,999")).toBe(1100);
  });
});

describe("formatEUR", () => {
  it("formatea céntimos como euros", () => {
    expect(formatEUR(2345).replace(/\u00a0/g, " ")).toBe("23,45 €");
    expect(centsToInput(2345)).toBe("23,45");
  });
});
