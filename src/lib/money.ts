const eurFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurCompactFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 0,
});

/** 2345 -> "23,45 €" */
export function formatEUR(cents: number) {
  return eurFormatter.format(cents / 100);
}

/** 2345 -> "23 €" (para ejes de gráficas) */
export function formatEURCompact(cents: number) {
  return eurCompactFormatter.format(cents / 100);
}

/** 2345 -> "23,45" */
export function formatAmount(cents: number) {
  return numberFormatter.format(cents / 100);
}

export function formatInteger(value: number) {
  return integerFormatter.format(value);
}

/** "23,45" -> 2345 */
export function parseAmountToCents(raw: string | null | undefined): number | null {
  if (!raw) return null;

  let value = raw
    .trim()
    .replace(/[€$£]/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/\s/g, "");

  if (!value) return null;

  const negative = value.startsWith("-");
  value = value.replace(/-/g, "").replace(/[^\d.,]/g, "");

  if (!/\d/.test(value)) return null;

  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");
  let normalized: string;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";
    normalized = value.split(thousandSeparator).join("");
    normalized = normalized.replace(decimalSeparator, ".");
  } else if (lastComma >= 0) {
    const parts = value.split(",");
    normalized =
      parts.length > 2
        ? `${parts.slice(0, -1).join("")}.${parts.at(-1)}`
        : parts.join(".");
  } else if (lastDot >= 0) {
    const parts = value.split(".");
    if (parts.length > 2) {
      normalized = `${parts.slice(0, -1).join("")}.${parts.at(-1)}`;
    } else if (parts[1]?.length === 3 && /^\d{1,3}$/.test(parts[0])) {
      // Formato español: 1.234 -> 1234
      normalized = parts.join("");
    } else {
      normalized = value;
    }
  } else {
    normalized = value;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  const cents = Math.round(parsed * 100);
  if (!Number.isSafeInteger(cents)) return null;

  return negative ? -cents : cents;
}

/** 2345 -> "23,45" (valor para un input) */
export function centsToInput(cents: number | null | undefined) {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** 2450 -> "+8,4 %" */
export function formatPercentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? "0 %" : "+100 %";
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 1,
  }).format(change)} %`;
}
