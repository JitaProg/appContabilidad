"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Receipt } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { relativeDayLabel } from "@/lib/dates";
import { useCategoryMap } from "@/lib/hooks";
import { BlobImage } from "@/components/blob-image";

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const categories = useCategoryMap();
  const category = categories.get(receipt.categoryId);

  return (
    <Link
      href={`/receipts/${receipt.id}`}
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors active:bg-paper-deep/50"
    >
      <BlobImage
        blob={receipt.thumb}
        alt={`Ticket de ${receipt.merchant}`}
        className="size-12 shrink-0 rounded-xl border border-line"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.95rem] font-semibold leading-tight text-ink">
          {receipt.merchant}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
          <span>{relativeDayLabel(receipt.purchaseDate)}</span>
          {category ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">
                {category.emoji} {category.name}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="tabular text-[0.95rem] font-semibold text-ink">
          {formatEUR(receipt.totalCents)}
        </span>
        <ChevronRight className="size-4 text-muted/70" />
      </div>
    </Link>
  );
}
