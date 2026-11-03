import { describe, expect, it } from "vitest";
import { guessCategory } from "./categories";

describe("guessCategory", () => {
  it("detecta supermercados conocidos", () => {
    expect(guessCategory("MERCADONA S.A.")).toBe("supermercado");
    expect(guessCategory("Carrefour Express")).toBe("supermercado");
  });

  it("detecta gasolineras y restaurantes", () => {
    expect(guessCategory("REPSOL ESTACION DE SERVICIO")).toBe("gasolina");
    expect(guessCategory("Restaurante El Rincón")).toBe("restaurantes");
  });

  it("normaliza acentos y mayúsculas", () => {
    expect(guessCategory("FARMACIA CENTRAL")).toBe("salud");
    expect(guessCategory("ÓPTICA VISIÓN")).toBe("salud");
  });

  it("usa Otros cuando no hay coincidencias", () => {
    expect(guessCategory("Comercio Desconocido")).toBe("otros");
    expect(guessCategory("")).toBe("otros");
  });
});
