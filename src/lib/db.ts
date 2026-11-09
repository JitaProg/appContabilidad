import Dexie, { type EntityTable } from "dexie";
import { monthDateRange } from "./dates";

export interface Receipt {
  id: number;
  createdAt: string;
  purchaseDate: string;
  merchant: string;
  totalCents: number;
  image: Blob | null;
  thumb: Blob | null;
}

export interface ReceiptDraft {
  createdAt?: string;
  purchaseDate: string;
  merchant: string;
  totalCents: number;
  image?: Blob | null;
  thumb?: Blob | null;
}

class TiquetDatabase extends Dexie {
  receipts!: EntityTable<Receipt, "id">;

  constructor() {
    super("tiquet");

    this.version(1).stores({
      receipts:
        "++id, purchaseDate, categoryId, merchant, totalCents, createdAt, [purchaseDate+totalCents]",
      items: "++id, receiptId",
      categories: "id, sort",
      settings: "key",
    });

    // Modelo actual: un ticket es una foto con importe, comercio y fecha.
    // Las versiones antiguas guardaban artículos, categorías y datos de OCR;
    // esos stores se eliminan al actualizar la base de datos.
    this.version(2).stores({
      receipts:
        "++id, purchaseDate, merchant, totalCents, createdAt, [purchaseDate+totalCents]",
    });
  }
}

const globalForDb = globalThis as unknown as { tiquetDb?: TiquetDatabase };

export const db = globalForDb.tiquetDb ?? new TiquetDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.tiquetDb = db;
}

export async function createReceipt(draft: ReceiptDraft) {
  return db.receipts.add({
    createdAt: draft.createdAt ?? new Date().toISOString(),
    purchaseDate: draft.purchaseDate,
    merchant: draft.merchant,
    totalCents: draft.totalCents,
    image: draft.image ?? null,
    thumb: draft.thumb ?? null,
  });
}

export async function updateReceipt(id: number, draft: ReceiptDraft) {
  await db.receipts.update(id, {
    purchaseDate: draft.purchaseDate,
    merchant: draft.merchant,
    totalCents: draft.totalCents,
    image: draft.image ?? null,
    thumb: draft.thumb ?? null,
  });
}

export async function deleteReceipt(id: number) {
  await db.receipts.delete(id);
}

export async function getReceipt(id: number) {
  return db.receipts.get(id);
}

export async function receiptsInMonth(month: string) {
  const { start, end } = monthDateRange(month);
  const receipts = await db.receipts
    .where("purchaseDate")
    .between(start, end, true, true)
    .toArray();

  return receipts.sort((a, b) => {
    if (a.purchaseDate === b.purchaseDate) {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return b.purchaseDate.localeCompare(a.purchaseDate);
  });
}

export async function receiptsBetween(start: string, end: string) {
  return db.receipts.where("purchaseDate").between(start, end, true, true).toArray();
}

export async function allReceipts() {
  return db.receipts.orderBy("purchaseDate").toArray();
}

export async function findPossibleDuplicate(receipt: {
  purchaseDate: string;
  totalCents: number;
  merchant: string;
}) {
  const candidates = await db.receipts
    .where("[purchaseDate+totalCents]")
    .equals([receipt.purchaseDate, receipt.totalCents])
    .toArray();

  const target = receipt.merchant.trim().toLowerCase();
  return (
    candidates.find((candidate) => candidate.merchant.trim().toLowerCase() === target) ??
    null
  );
}

export async function clearAllData() {
  await db.receipts.clear();
}
