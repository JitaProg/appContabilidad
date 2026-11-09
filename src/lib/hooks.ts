"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

export function useReceipt(id: number) {
  return useLiveQuery(async () => {
    if (!Number.isFinite(id)) return null;
    return (await db.receipts.get(id)) ?? null;
  }, [id]);
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
