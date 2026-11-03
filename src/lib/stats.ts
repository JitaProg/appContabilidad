import type { Receipt } from "./db";
import { daysElapsedInMonth, lastMonths, monthOf } from "./dates";

export interface CategoryTotal {
  categoryId: string;
  totalCents: number;
  count: number;
}

export interface MerchantTotal {
  merchant: string;
  totalCents: number;
  count: number;
}

export interface MonthSummary {
  month: string;
  totalCents: number;
  count: number;
  averageCents: number;
  dailyAverageCents: number;
  largestCents: number;
  byCategory: CategoryTotal[];
  topMerchants: MerchantTotal[];
}

export function summarizeMonth(
  month: string,
  receipts: Receipt[],
): Omit<MonthSummary, "month"> {
  const monthReceipts = receipts.filter((receipt) => monthOf(receipt.purchaseDate) === month);
  const totalCents = monthReceipts.reduce((sum, receipt) => sum + receipt.totalCents, 0);
  const count = monthReceipts.length;

  const categoryMap = new Map<string, CategoryTotal>();
  const merchantMap = new Map<string, MerchantTotal>();

  for (const receipt of monthReceipts) {
    const category = categoryMap.get(receipt.categoryId) ?? {
      categoryId: receipt.categoryId,
      totalCents: 0,
      count: 0,
    };
    category.totalCents += receipt.totalCents;
    category.count += 1;
    categoryMap.set(receipt.categoryId, category);

    const merchantKey = receipt.merchant.trim();
    const merchant = merchantMap.get(merchantKey) ?? {
      merchant: merchantKey,
      totalCents: 0,
      count: 0,
    };
    merchant.totalCents += receipt.totalCents;
    merchant.count += 1;
    merchantMap.set(merchantKey, merchant);
  }

  const byCategory = [...categoryMap.values()].sort((a, b) => b.totalCents - a.totalCents);
  const topMerchants = [...merchantMap.values()]
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 5);

  const days = daysElapsedInMonth(month);

  return {
    totalCents,
    count,
    averageCents: count > 0 ? Math.round(totalCents / count) : 0,
    dailyAverageCents: days > 0 ? Math.round(totalCents / days) : 0,
    largestCents: monthReceipts.reduce(
      (largest, receipt) => Math.max(largest, receipt.totalCents),
      0,
    ),
    byCategory,
    topMerchants,
  };
}

export interface MonthlyPoint {
  month: string;
  totalCents: number;
  count: number;
}

export function monthlySeries(receipts: Receipt[], months: number, endMonth: string) {
  const monthList = lastMonths(months, endMonth);
  const totals = new Map<string, { totalCents: number; count: number }>();

  for (const month of monthList) {
    totals.set(month, { totalCents: 0, count: 0 });
  }

  for (const receipt of receipts) {
    const key = monthOf(receipt.purchaseDate);
    const entry = totals.get(key);
    if (entry) {
      entry.totalCents += receipt.totalCents;
      entry.count += 1;
    }
  }

  return monthList.map<MonthlyPoint>((month) => ({
    month,
    totalCents: totals.get(month)?.totalCents ?? 0,
    count: totals.get(month)?.count ?? 0,
  }));
}
