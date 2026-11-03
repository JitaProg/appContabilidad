const MONTH_LONG = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});

const MONTH_SHORT = new Intl.DateTimeFormat("es-ES", {
  month: "short",
});

const DAY_MONTH = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
});

const FULL_DATE = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const WEEKDAY_SHORT = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
});

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

export function monthOf(dateISO: string) {
  return dateISO.slice(0, 7);
}

export function isMonth(value: string | null | undefined): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function parseISODate(dateISO: string) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function monthToDate(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1);
}

export function addMonths(month: string, delta: number) {
  const date = monthToDate(month);
  date.setMonth(date.getMonth() + delta);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function monthLabel(month: string, style: "long" | "short" = "long") {
  const date = monthToDate(month);
  const label = style === "long" ? MONTH_LONG.format(date) : MONTH_SHORT.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthShortLabel(month: string) {
  return monthLabel(month, "short");
}

export function daysInMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

export function daysElapsedInMonth(month: string) {
  const today = new Date();
  if (monthOf(todayISO()) !== month) return daysInMonth(month);
  return today.getDate();
}

export function lastMonths(count: number, endMonth = currentMonth()) {
  const months: string[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    months.push(addMonths(endMonth, -index));
  }
  return months;
}

export function isFutureMonth(month: string) {
  return month > currentMonth();
}

export function formatDayMonth(dateISO: string) {
  return DAY_MONTH.format(parseISODate(dateISO)).replace(".", "");
}

export function formatFullDate(dateISO: string) {
  const label = FULL_DATE.format(parseISODate(dateISO));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function weekdayShort(dateISO: string) {
  return WEEKDAY_SHORT.format(parseISODate(dateISO)).replace(".", "");
}

export function relativeDayLabel(dateISO: string) {
  const today = todayISO();
  if (dateISO === today) return "Hoy";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateISO === toISODate(yesterday)) return "Ayer";
  return formatDayMonth(dateISO);
}

export function formatDateInput(dateISO: string) {
  if (!dateISO) return "";
  const [year, month, day] = dateISO.split("-");
  return `${day}/${month}/${year}`;
}

/** Convierte el valor de un input type=date a YYYY-MM-DD (ya viene así). */
export function normalizeDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayISO();
}

/** Rango inclusivo [inicio, fin] del mes en formato YYYY-MM-DD. */
export function monthDateRange(month: string) {
  return {
    start: `${month}-01`,
    end: `${month}-${pad(daysInMonth(month))}`,
  };
}
