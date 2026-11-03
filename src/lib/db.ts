import Dexie, { type EntityTable } from "dexie";
import { DEFAULT_CATEGORIES, type Category } from "./categories";
import { monthDateRange } from "./dates";

export interface VatEntry {
  rate: number;
  baseCents: number | null;
  amountCents: number | null;
}

export interface Receipt {
  id: number;
  createdAt: string;
  purchaseDate: string;
  merchant: string;
  merchantNif: string | null;
  totalCents: number;
  categoryId: string;
  notes: string | null;
  rawText: string | null;
  ocrConfidence: number | null;
  source: "ocr" | "manual";
  vat: VatEntry[];
  image: Blob | null;
  thumb: Blob | null;
}

export interface ReceiptItem {
  id: number;
  receiptId: number;
  description: string;
  totalCents: number;
  qty: number | null;
}

export interface Setting {
  key: string;
  value: string;
}

export interface ReceiptItemDraft {
  description: string;
  totalCents: number;
  qty?: number | null;
}

export interface ReceiptDraft {
  createdAt?: string;
  purchaseDate: string;
  merchant: string;
  totalCents: number;
  categoryId: string;
  notes?: string | null;
  merchantNif?: string | null;
  rawText?: string | null;
  ocrConfidence?: number | null;
  source: "ocr" | "manual";
  vat?: VatEntry[];
  image?: Blob | null;
  thumb?: Blob | null;
}

class TiquetDatabase extends Dexie {
  receipts!: EntityTable<Receipt, "id">;
  items!: EntityTable<ReceiptItem, "id">;
  categories!: EntityTable<Category, "id">;
  settings!: EntityTable<Setting, "key">;

  constructor() {
    super("tiquet");

    this.version(1).stores({
      receipts:
        "++id, purchaseDate, categoryId, merchant, totalCents, createdAt, [purchaseDate+totalCents]",
      items: "++id, receiptId",
      categories: "id, sort",
      settings: "key",
    });
  }
}

const globalForDb = globalThis as unknown as { tiquetDb?: TiquetDatabase };

export const db = globalForDb.tiquetDb ?? new TiquetDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.tiquetDb = db;
}

let seedPromise: Promise<void> | null = null;

export function ensureSeedData() {
  seedPromise ??= (async () => {
    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
      await db.categories.bulkAdd(DEFAULT_CATEGORIES);
    }

    const welcome = await db.settings.get("welcomeSeen");
    if (!welcome) {
      await db.settings.put({ key: "welcomeSeen", value: "0" });
    }
  })();

  return seedPromise;
}

export async function createReceipt(
  draft: ReceiptDraft,
  items: ReceiptItemDraft[] = [],
) {
  return db.transaction("rw", db.receipts, db.items, async () => {
    const receiptId = await db.receipts.add({
      createdAt: draft.createdAt ?? new Date().toISOString(),
      purchaseDate: draft.purchaseDate,
      merchant: draft.merchant,
      merchantNif: draft.merchantNif ?? null,
      totalCents: draft.totalCents,
      categoryId: draft.categoryId,
      notes: draft.notes ?? null,
      rawText: draft.rawText ?? null,
      ocrConfidence: draft.ocrConfidence ?? null,
      source: draft.source,
      vat: draft.vat ?? [],
      image: draft.image ?? null,
      thumb: draft.thumb ?? null,
    });

    if (items.length > 0) {
      await db.items.bulkAdd(
        items.map((item) => ({
          receiptId,
          description: item.description,
          totalCents: item.totalCents,
          qty: item.qty ?? null,
        })),
      );
    }

    return receiptId;
  });
}

export async function updateReceipt(
  id: number,
  draft: ReceiptDraft,
  items: ReceiptItemDraft[] = [],
) {
  return db.transaction("rw", db.receipts, db.items, async () => {
    await db.receipts.update(id, {
      purchaseDate: draft.purchaseDate,
      merchant: draft.merchant,
      merchantNif: draft.merchantNif ?? null,
      totalCents: draft.totalCents,
      categoryId: draft.categoryId,
      notes: draft.notes ?? null,
      rawText: draft.rawText ?? null,
      ocrConfidence: draft.ocrConfidence ?? null,
      source: draft.source,
      vat: draft.vat ?? [],
      image: draft.image ?? null,
      thumb: draft.thumb ?? null,
    });

    await db.items.where("receiptId").equals(id).delete();

    if (items.length > 0) {
      await db.items.bulkAdd(
        items.map((item) => ({
          receiptId: id,
          description: item.description,
          totalCents: item.totalCents,
          qty: item.qty ?? null,
        })),
      );
    }
  });
}

export async function deleteReceipt(id: number) {
  return db.transaction("rw", db.receipts, db.items, async () => {
    await db.items.where("receiptId").equals(id).delete();
    await db.receipts.delete(id);
  });
}

export async function getReceipt(id: number) {
  return db.receipts.get(id);
}

export async function itemsForReceipt(receiptId: number) {
  return db.items.where("receiptId").equals(receiptId).toArray();
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

export async function getSetting(key: string) {
  const setting = await db.settings.get(key);
  return setting?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  return db.settings.put({ key, value });
}

export async function clearAllData() {
  return db.transaction("rw", db.receipts, db.items, db.categories, db.settings, async () => {
    await db.receipts.clear();
    await db.items.clear();
    await db.categories.clear();
    await db.settings.clear();
    seedPromise = null;
    await ensureSeedData();
  });
}
