"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { DEFAULT_CATEGORIES, type Category } from "./categories";

export function useCategories(): Category[] {
  const categories = useLiveQuery(() => db.categories.orderBy("sort").toArray(), []);
  return categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
}

export function useCategoryMap() {
  const categories = useCategories();
  return useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
}

export function useReceipt(id: number) {
  return useLiveQuery(async () => {
    if (!Number.isFinite(id)) return null;
    return (await db.receipts.get(id)) ?? null;
  }, [id]);
}

export function useReceiptItems(receiptId: number) {
  return useLiveQuery(
    () => db.items.where("receiptId").equals(receiptId).toArray(),
    [receiptId],
  );
}

export function useRecentMerchants(limit = 20) {
  return useLiveQuery(async () => {
    const receipts = await db.receipts.orderBy("createdAt").reverse().limit(80).toArray();
    const names = receipts
      .map((receipt) => receipt.merchant.trim())
      .filter((name) => name.length > 0);
    return [...new Set(names)].slice(0, limit);
  }, [limit]);
}
