import { todayISO } from "../dates";
import { parseAmountToCents } from "../money";

export interface ParsedItem {
  description: string;
  totalCents: number;
  qty: number | null;
}

export interface ParsedVat {
  rate: number;
  baseCents: number | null;
  amountCents: number | null;
}

export interface ParsedReceipt {
  merchant: string | null;
  merchantConfidence: number;
  date: string | null;
  dateConfidence: number;
  totalCents: number | null;
  totalConfidence: number;
  nif: string | null;
  vat: ParsedVat[];
  items: ParsedItem[];
  warnings: string[];
  text: string;
  textConfidence: number;
}

const AMOUNT_SOURCE = String.raw`-?(?:\d{1,3}(?:[.\s]\d{3})+|\d+)[.,]\d{1,2}`;
const AMOUNT_ONLY_RE = new RegExp(
  String.raw`^(?:€\s*)?${AMOUNT_SOURCE}\s*(?:€|EUR)?$`,
  "i",
);
const DATE_RE =
  /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b|\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/g;

const KNOWN_MERCHANTS: { pattern: RegExp; name: string }[] = [
  { pattern: /mercadona/i, name: "Mercadona" },
  { pattern: /carrefour/i, name: "Carrefour" },
  { pattern: /lidl/i, name: "Lidl" },
  { pattern: /\baldi\b/i, name: "Aldi" },
  { pattern: /\bdia\b/i, name: "Dia" },
  { pattern: /alcampo/i, name: "Alcampo" },
  { pattern: /eroski/i, name: "Eroski" },
  { pattern: /consum/i, name: "Consum" },
  { pattern: /\bspar\b/i, name: "Spar" },
  { pattern: /supercor/i, name: "Supercor" },
  { pattern: /ahorramas/i, name: "Ahorramas" },
  { pattern: /hipercor/i, name: "Hipercor" },
  { pattern: /repsol/i, name: "Repsol" },
  { pattern: /cepsa/i, name: "Cepsa" },
  { pattern: /\bbp\b/i, name: "BP" },
  { pattern: /\bshell\b/i, name: "Shell" },
  { pattern: /\bgalp\b/i, name: "Galp" },
  { pattern: /ballenoil/i, name: "Ballenoil" },
  { pattern: /petroprix/i, name: "Petroprix" },
  { pattern: /mcdonald/i, name: "McDonald's" },
  { pattern: /burger\s*king/i, name: "Burger King" },
  { pattern: /\bkfc\b/i, name: "KFC" },
  { pattern: /telepizza/i, name: "Telepizza" },
  { pattern: /domino'?s/i, name: "Domino's" },
  { pattern: /starbucks/i, name: "Starbucks" },
  { pattern: /renfe/i, name: "Renfe" },
  { pattern: /\buber\b/i, name: "Uber" },
  { pattern: /cabify/i, name: "Cabify" },
  { pattern: /ikea/i, name: "IKEA" },
  { pattern: /leroy\s*merlin/i, name: "Leroy Merlin" },
  { pattern: /bricomart/i, name: "Bricomart" },
  { pattern: /mediamarkt|media\s*markt/i, name: "MediaMarkt" },
  { pattern: /decathlon/i, name: "Decathlon" },
  { pattern: /primark/i, name: "Primark" },
  { pattern: /\bzara\b/i, name: "Zara" },
  { pattern: /el\s*corte\s*ingl[eé]s/i, name: "El Corte Inglés" },
  { pattern: /farmacia/i, name: "Farmacia" },
];

const HEADER_SKIP =
  /\b(CALLE|C\/|CL\s|AVDA|AVENIDA|PLAZA|PZA|POL[IÍ]GONO|CARRETERA|CTRA|CP\s?\d{5}|TEL|TFNO|FAX|WWW|HTTP|EMAIL|@|CIF|NIF|S\.?L\.?|S\.?A\.?|S\.?L\.?U\.?|C\.?B\.?|TICKET|FACTURA|SIMPLIFICADA|RECIBO|COPIA|DUPLICADO|BIENVENIDO|GRACIAS|HORARIO|CAJA|CAJERO|VENDEDOR|N[ºO°]|NUMERO|PEDIDO|MESA|FECHA|HORA|OPERACI[OÓ]N|AUTORIZACI[OÓ]N)\b/i;

const TOTAL_EXCLUDE =
  /\b(TOTAL\s+(IVA|I\.?V\.?A|BASE|ART[IÍ]CULOS|UNIDADES|UDS|AHORRO|DESCUENTO|DTO|CAMBIO|ENTREGADO)|SUB\s*-?\s*TOTAL)\b/i;

const PAYMENT_LINE =
  /\b(CAMBIO|EFECTIVO|TARJETA|ENTREGADO|VUELTO|CONTADO|VISA|MASTERCARD|AMEX|BIZUM|APPLE\s*PAY|GOOGLE\s*PAY|PAGO|ABONADO|SALDO)\b/i;

const NON_ITEM =
  /\b(TOTAL|SUBTOTAL|IVA|I\.?V\.?A|IMPUESTO|BASE|CAMBIO|EFECTIVO|TARJETA|ENTREGADO|VUELTO|DESCUENTO|AHORRO|FECHA|HORA|TICKET|FACTURA|NIF|CIF|TEL|WWW|GRACIAS|CAJA|CAJERO|VENDEDOR|ARTICULOS|ARTÍCULOS|UNIDADES|PEDIDO|MESA|OPERACI|AUTORIZACI|VISA|BIZUM|CLIENTE|SOCIOS?|PUNTOS?)\b/i;

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function cleanLine(line: string) {
  return line
    .replace(/\u00a0/g, " ")
    .replace(/[|¦]/g, " ")
    .replace(/[“”„]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function removeDateLike(line: string) {
  return line.replace(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g, " ").replace(/\s+/g, " ").trim();
}

function extractAmounts(line: string) {
  const cleaned = removeDateLike(line);
  const regex = new RegExp(AMOUNT_SOURCE, "g");
  const results: { token: string; cents: number; index: number }[] = [];

  for (const match of cleaned.matchAll(regex)) {
    const token = match[0];
    const cents = parseAmountToCents(token);
    if (cents === null) continue;
    results.push({ token, cents, index: match.index ?? 0 });
  }

  return results;
}

function isAmountOnlyLine(line: string) {
  const cleaned = removeDateLike(line).replace(/\s+/g, " ").trim();
  return AMOUNT_ONLY_RE.test(cleaned);
}

function hasTotalKeyword(line: string) {
  const upper = stripAccents(line).toUpperCase();
  if (TOTAL_EXCLUDE.test(upper)) return false;
  return /\bTOTAL\b/.test(upper) || /\bIMPORTE\b/.test(upper) || /\bA\s+PAGAR\b/.test(upper);
}

function totalKeywordScore(line: string) {
  const upper = stripAccents(line).toUpperCase();
  if (
    /TOTAL\s*(A\s*)?(PAGAR|COMPRA)|IMPORTE\s*TOTAL|TOTAL\s*(EUR|€|\(€\))/.test(upper)
  ) {
    return 100;
  }
  if (/\bTOTAL\b/.test(upper)) return 80;
  if (/\b(A\s+PAGAR|IMPORTE)\b/.test(upper)) return 60;
  return 0;
}

function buildISODate(year: number, month: number, day: number) {
  if (year < 100) year += year < 70 ? 2000 : 1900;
  if (year < 1990 || year > 2100) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (iso > todayISO()) return null;
  return iso;
}

function findDate(lines: string[]) {
  let best: { date: string; score: number; explicit: boolean } | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const upper = stripAccents(line).toUpperCase();
    const explicit = /\b(FECHA|DATA|F\.?\s*EMISI[OÓ]N|FECHA\s+COMPRA)\b/.test(upper);

    DATE_RE.lastIndex = 0;
    for (const match of line.matchAll(DATE_RE)) {
      let date: string | null = null;

      if (match[1]) {
        date = buildISODate(Number(match[1]), Number(match[2]), Number(match[3]));
      } else if (match[4]) {
        date = buildISODate(Number(match[6]), Number(match[5]), Number(match[4]));
      }

      if (!date) continue;

      const score = (explicit ? 100 : 0) + (match[1] ? 12 : 0) + index * 0.2;
      if (!best || score > best.score) {
        best = { date, score, explicit };
      }
    }
  }

  if (!best) return { date: null as string | null, confidence: 0 };

  const confidence = best.explicit ? 0.95 : best.score >= 12 ? 0.82 : 0.68;
  return { date: best.date, confidence };
}

function findMerchant(lines: string[]) {
  const wholeText = lines.join("\n");
  for (const merchant of KNOWN_MERCHANTS) {
    if (merchant.pattern.test(wholeText)) {
      return { merchant: merchant.name, confidence: 0.92 };
    }
  }

  let best: { value: string; score: number } | null = null;

  const headerLines = lines.slice(0, 10);
  for (let index = 0; index < headerLines.length; index += 1) {
    const clean = cleanLine(headerLines[index]);
    if (clean.length < 3 || clean.length > 60) continue;
    if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(clean)) continue;
    if (/^\d/.test(clean)) continue;
    if (HEADER_SKIP.test(clean)) continue;
    if (extractAmounts(clean).length > 0) continue;
    if (DATE_RE.test(clean)) {
      DATE_RE.lastIndex = 0;
      continue;
    }
    DATE_RE.lastIndex = 0;

    const letters = (clean.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) ?? []).length;
    const digits = (clean.match(/\d/g) ?? []).length;
    if (letters < 3) continue;
    if (digits > letters * 0.4) continue;

    const uppercaseRatio =
      clean.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, "").length / Math.max(1, letters);
    const score =
      letters + Math.max(0, 14 - index * 2) + (uppercaseRatio > 0.7 ? 8 : 0) + (digits === 0 ? 4 : 0);

    if (!best || score > best.score) {
      best = { value: clean, score };
    }
  }

  if (!best) return { merchant: null as string | null, confidence: 0 };

  const cleaned = best.value
    .replace(/[\s,.-]+(S\.?A\.?|S\.?L\.?|S\.?L\.?U\.?|C\.?B\.?|S\.?C\.?P\.?)$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const merchant =
    cleaned && cleaned === cleaned.toUpperCase() ? toTitleCase(cleaned) : cleaned || best.value;

  return { merchant, confidence: 0.6 };
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function findNif(lines: string[]) {
  const patterns = [
    /\b([ABCDEFGHJNPQRSUVW])\s*[-.]?\s*(\d{7})\s*[-.]?\s*([0-9A-J])\b/i,
    /\b([ABCDEFGHJNPQRSUVW])\s*[-.]?\s*(\d{8})\b/i,
    /\b(\d{8})\s*[-]?\s*([A-Z])\b/,
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (!match) continue;

      if (match.length === 4 && match[1] && match[2] && match[3] !== undefined) {
        return `${match[1]}${match[2]}${match[3]}`.toUpperCase();
      }
      if (match.length === 3 && match[1] && match[2]) {
        return `${match[1]}${match[2]}`.toUpperCase();
      }
    }
  }

  return null;
}

function findTotal(lines: string[]) {
  let bestCents: number | null = null;
  let bestScore = 0;
  let bestBaseScore = 0;
  let bestIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!hasTotalKeyword(line)) continue;

    const baseScore = totalKeywordScore(line);
    if (baseScore === 0) continue;

    const amounts = extractAmounts(line);
    let cents = amounts.at(-1)?.cents ?? null;
    let sameLine = true;

    if (cents === null) {
      sameLine = false;
      for (let next = index + 1; next <= index + 2 && next < lines.length; next += 1) {
        if (hasTotalKeyword(lines[next])) break;
        if (!isAmountOnlyLine(lines[next])) continue;
        const nextAmounts = extractAmounts(lines[next]);
        if (nextAmounts.length === 1) {
          cents = nextAmounts[0].cents;
          break;
        }
      }
    }

    if (cents === null || cents <= 0 || cents > 1_000_000) continue;

    const positionBonus = (index / Math.max(1, lines.length - 1)) * 15;
    const bottomBonus = index > lines.length * 0.6 ? 6 : 0;
    const score = baseScore + positionBonus + bottomBonus + (sameLine ? 6 : 0);

    if (score > bestScore) {
      bestCents = cents;
      bestScore = score;
      bestBaseScore = baseScore;
      bestIndex = index;
    }
  }

  if (bestCents !== null) {
    let confidence = bestBaseScore >= 100 ? 0.95 : bestBaseScore >= 80 ? 0.85 : 0.72;
    confidence = Math.min(0.97, confidence + (bestIndex > lines.length * 0.6 ? 0.02 : 0));
    return { cents: bestCents, confidence, estimated: false, index: bestIndex };
  }

  // Rescate: última línea del final que sea solo un importe, sin palabras de pago.
  for (let index = lines.length - 1; index >= Math.floor(lines.length * 0.35); index -= 1) {
    const line = lines[index];
    if (!line || PAYMENT_LINE.test(line) || hasTotalKeyword(line)) continue;
    if (!isAmountOnlyLine(line)) continue;
    const amounts = extractAmounts(line);
    if (amounts.length !== 1) continue;
    const cents = amounts[0].cents;
    if (cents <= 0) continue;
    return { cents, confidence: 0.28, estimated: true, index };
  }

  return { cents: null as number | null, confidence: 0, estimated: false, index: -1 };
}

function findVat(lines: string[]) {
  const byRate = new Map<number, ParsedVat>();

  for (const line of lines) {
    const upper = stripAccents(line).toUpperCase();
    const rateMatch = upper.match(
      /\b(?:IVA|I\.V\.A\.?)\s*(\d{1,2})(?:[.,]\d{1,2})?\s*%/,
    );
    if (!rateMatch) continue;

    const rate = Number(rateMatch[1]);
    if (!Number.isFinite(rate) || rate < 0 || rate > 30) continue;

    const amounts = extractAmounts(line);
    if (amounts.length === 0) continue;

    byRate.set(rate, {
      rate,
      baseCents: byRate.get(rate)?.baseCents ?? null,
      amountCents: amounts.at(-1)?.cents ?? null,
    });
  }

  return [...byRate.values()].sort((a, b) => a.rate - b.rate);
}

function findItems(lines: string[], totalIndex: number) {
  const items: ParsedItem[] = [];
  const seen = new Set<string>();
  const limit = totalIndex >= 0 ? totalIndex : lines.length;

  for (let index = 0; index < limit; index += 1) {
    const line = cleanLine(lines[index]);
    if (line.length < 4) continue;

    const upper = stripAccents(line).toUpperCase();
    if (NON_ITEM.test(upper) || PAYMENT_LINE.test(upper) || hasTotalKeyword(line)) continue;
    if (/\b(FECHA|HORA|TEL|NIF|CIF|WWW)\b/.test(upper)) continue;

    const amounts = extractAmounts(line);
    if (amounts.length === 0) continue;

    const lastAmount = amounts.at(-1);
    if (!lastAmount) continue;

    // La línea debe terminar en el importe (con € y/o IVA opcional).
    const ending = removeDateLike(line).slice(lastAmount.index + lastAmount.token.length).trim();
    if (ending && !/^[€\s*]*(?:\d{1,2}\s*%)?$/i.test(ending)) continue;

    let description = line.slice(0, lastAmount.index).trim();
    description = description
      .replace(/^\d{6,}\s+/, "")
      .replace(/^[*·.\-\s]+/, "")
      .replace(/\s+\d{1,2}%$/, "")
      .replace(/\s+[A-Z]$/, "")
      .trim();

    if (description.length < 2) continue;
    if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2}/.test(description)) continue;

    const qtyMatch = description.match(/^(\d{1,3})\s*[xX]\s*/);
    const qty = qtyMatch ? Number(qtyMatch[1]) : null;
    if (qtyMatch) description = description.slice(qtyMatch[0].length).trim();

    if (description.length < 2) continue;

    const key = `${description.toLowerCase()}|${lastAmount.cents}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      description: description.slice(0, 80),
      totalCents: lastAmount.cents,
      qty,
    });

    if (items.length >= 50) break;
  }

  return items;
}

export function parseReceipt(rawText: string, textConfidence = 0): ParsedReceipt {
  const normalizedText = rawText.replace(/\r\n?/g, "\n").trim();
  const lines = normalizedText
    .split("\n")
    .map(cleanLine)
    .filter((line) => line.length > 0);

  const warnings: string[] = [];

  if (lines.length === 0) {
    return {
      merchant: null,
      merchantConfidence: 0,
      date: null,
      dateConfidence: 0,
      totalCents: null,
      totalConfidence: 0,
      nif: null,
      vat: [],
      items: [],
      warnings: ["No se ha podido leer texto en la imagen."],
      text: normalizedText,
      textConfidence,
    };
  }

  const merchant = findMerchant(lines);
  const date = findDate(lines);
  const total = findTotal(lines);
  const nif = findNif(lines);
  const vat = findVat(lines);
  const items = findItems(lines, total.index);

  if (!merchant.merchant) warnings.push("No se ha detectado el comercio.");
  if (!date.date) warnings.push("No se ha detectado la fecha del ticket.");
  if (total.cents === null) {
    warnings.push("No se ha detectado el total. Introdúcelo manualmente.");
  } else if (total.estimated) {
    warnings.push("El importe se ha estimado a partir del texto. Confírmalo antes de guardar.");
  }

  if (textConfidence > 0 && textConfidence < 55) {
    warnings.push("La calidad del texto leído es baja; revisa todos los campos.");
  }

  if (total.cents !== null && items.length >= 2) {
    const itemSum = items.reduce((sum, item) => sum + item.totalCents, 0);
    if (itemSum > total.cents * 1.15) {
      warnings.push("Los artículos detectados suman más que el total.");
    }
  }

  let totalConfidence = total.confidence;
  if (total.cents !== null && items.length >= 3) {
    const itemSum = items.reduce((sum, item) => sum + item.totalCents, 0);
    if (Math.abs(itemSum - total.cents) <= Math.max(5, total.cents * 0.02)) {
      totalConfidence = Math.min(0.99, totalConfidence + 0.03);
    }
  }

  return {
    merchant: merchant.merchant,
    merchantConfidence: merchant.confidence,
    date: date.date,
    dateConfidence: date.confidence,
    totalCents: total.cents,
    totalConfidence,
    nif,
    vat,
    items,
    warnings,
    text: normalizedText,
    textConfidence,
  };
}
