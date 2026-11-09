"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, ReceiptText, Search, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MonthSwitcher } from "@/components/month-switcher";
import { ReceiptCard } from "@/components/receipt-card";
import { EmptyState, Input, Skeleton } from "@/components/ui";
import { useMonth } from "@/components/providers";
import { allReceipts, receiptsInMonth, type Receipt } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { relativeDayLabel, weekdayShort } from "@/lib/dates";
import { cn, normalizeForMatch } from "@/lib/utils";

export default function ReceiptsPage() {
  const { month, ready } = useMonth();
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const receipts = useLiveQuery(async () => {
    if (showAll) {
      const all = await allReceipts();
      return all.reverse();
    }
    return receiptsInMonth(month);
  }, [month, showAll]);

  const filtered = useMemo(() => {
    const list = receipts ?? [];
    const needle = normalizeForMatch(query.trim());
    if (!needle) return list;

    return list.filter((receipt) =>
      normalizeForMatch(receipt.merchant).includes(needle),
    );
  }, [receipts, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Receipt[]>();
    for (const receipt of filtered) {
      const list = map.get(receipt.purchaseDate) ?? [];
      list.push(receipt);
      map.set(receipt.purchaseDate, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const totalCents = useMemo(
    () => filtered.reduce((sum, receipt) => sum + receipt.totalCents, 0),
    [filtered],
  );

  const loading = !ready || receipts === undefined;

  return (
    <div className="animate-rise">
      <PageHeader
        title="Tickets"
        subtitle={
          loading
            ? "Cargando…"
            : `${filtered.length} ${filtered.length === 1 ? "ticket" : "tickets"} · ${formatEUR(totalCents)}`
        }
        action={
          <Link
            href="/receipts/new"
            aria-label="Añadir ticket"
            className="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:bg-paper-deep"
          >
            <Plus className="size-5" />
          </Link>
        }
      />

      <div className="space-y-3 px-5 pt-4">
        <div className="flex items-center justify-between gap-2">
          {showAll ? (
            <span className="text-xs font-medium text-muted">Todo el historial</span>
          ) : (
            <MonthSwitcher />
          )}

          <div className="flex shrink-0 rounded-full border border-line bg-surface p-1 text-[0.7rem] font-semibold">
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className={cn(
                "rounded-full px-2.5 py-1.5 transition-colors",
                !showAll ? "bg-brand text-white" : "text-muted",
              )}
            >
              Mes
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className={cn(
                "rounded-full px-2.5 py-1.5 transition-colors",
                showAll ? "bg-brand text-white" : "text-muted",
              )}
            >
              Todo
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            inputMode="search"
            placeholder="Buscar comercio"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-11 pr-11"
            aria-label="Buscar tickets"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-paper-deep"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="px-5 pt-2">
        {loading ? (
          <div className="space-y-3 pt-4">
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton key={index} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="pt-6">
            <EmptyState
              icon={<ReceiptText className="size-6" />}
              title={query ? "Sin resultados" : "Todavía no hay tickets"}
              description={
                query
                  ? "Prueba con otro nombre de comercio o cambia el filtro."
                  : showAll
                    ? "Cuando añadas un ticket aparecerá aquí."
                    : "En este mes no hay tickets guardados. Cambia de mes o añade uno nuevo."
              }
              action={
                query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-sm font-semibold text-brand"
                  >
                    Limpiar búsqueda
                  </button>
                ) : (
                  <Link
                    href="/receipts/new"
                    className="text-sm font-semibold text-brand"
                  >
                    Añadir un ticket
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="pt-2">
            {groups.map(([date, dayReceipts]) => {
              const dayTotal = dayReceipts.reduce(
                (sum, receipt) => sum + receipt.totalCents,
                0,
              );

              return (
                <section key={date} className="mt-4 first:mt-2">
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <h2 className="text-sm font-semibold text-ink">
                      {relativeDayLabel(date)}
                      <span className="ml-1.5 text-xs font-normal text-muted">
                        {weekdayShort(date)}
                      </span>
                    </h2>
                    <span className="tabular text-xs font-medium text-muted">
                      {formatEUR(dayTotal)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayReceipts.map((receipt) => (
                      <ReceiptCard key={receipt.id} receipt={receipt} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
