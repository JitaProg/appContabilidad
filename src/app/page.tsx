"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Camera,
  ChevronRight,
  Lock,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { addMonths, currentMonth } from "@/lib/dates";
import { receiptsInMonth } from "@/lib/db";
import { formatEUR, formatPercentChange } from "@/lib/money";
import { summarizeMonth } from "@/lib/stats";
import { useCategories } from "@/lib/hooks";
import { useMonth } from "@/components/providers";
import { AppLogo } from "@/components/app-logo";
import { MonthSwitcher } from "@/components/month-switcher";
import { ReceiptCard } from "@/components/receipt-card";
import { CategoryDonut } from "@/components/charts";
import {
  buttonStyles,
  Card,
  EmptyState,
  SectionTitle,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { month, ready } = useMonth();
  const categories = useCategories();
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const receipts = useLiveQuery(() => receiptsInMonth(month), [month]);
  const previousReceipts = useLiveQuery(
    () => receiptsInMonth(addMonths(month, -1)),
    [month],
  );

  const summary = useMemo(
    () => summarizeMonth(month, receipts ?? []),
    [month, receipts],
  );
  const previousTotal = useMemo(
    () => (previousReceipts ?? []).reduce((sum, receipt) => sum + receipt.totalCents, 0),
    [previousReceipts],
  );

  const loading = !ready || receipts === undefined;
  const hasReceipts = (receipts?.length ?? 0) > 0;
  const isCurrentMonth = month === currentMonth();

  const donutData = summary.byCategory.slice(0, 6).map((item) => {
    const category = categoryMap.get(item.categoryId);
    return {
      name: category?.name ?? "Otros",
      value: item.totalCents,
      color: category?.color ?? "#64748b",
    };
  });

  const delta = summary.totalCents - previousTotal;
  const percent = formatPercentChange(summary.totalCents, previousTotal);

  return (
    <div className="animate-rise">
      <header className="safe-top px-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AppLogo />
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand">
                Tu contabilidad
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-ink">Tiquet</h1>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[0.65rem] font-medium text-muted">
            <Lock className="size-3" />
            Solo en tu móvil
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <MonthSwitcher />
          <Link
            href="/receipts/new"
            aria-label="Añadir ticket a mano"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:bg-paper-deep"
          >
            <Plus className="size-5" />
          </Link>
        </div>
      </header>

      <div className="space-y-6 px-5">
        <section className="relative overflow-hidden rounded-[28px] bg-brand px-5 pb-5 pt-6 text-white shadow-xl shadow-brand/20">
          <div className="pointer-events-none absolute -right-12 -top-16 size-52 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-48 rounded-full bg-white/5" />

          <p className="relative text-sm font-medium text-white/75">
            Gastado en {isCurrentMonth ? "lo que va de mes" : "el mes"}
          </p>

          {loading ? (
            <Skeleton className="mt-2 h-11 w-40 bg-white/20" />
          ) : (
            <p className="tabular relative mt-1 text-[2.6rem] font-semibold leading-none tracking-tight">
              {formatEUR(summary.totalCents)}
            </p>
          )}

          <div className="relative mt-5 flex flex-wrap items-center gap-2 text-xs">
            {loading ? (
              <Skeleton className="h-6 w-24 bg-white/20" />
            ) : (
              <>
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">
                  {summary.count} {summary.count === 1 ? "ticket" : "tickets"}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">
                  {formatEUR(summary.dailyAverageCents)} / día
                </span>
                {previousTotal > 0 ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold",
                      delta <= 0
                        ? "bg-emerald-300/20 text-emerald-50"
                        : "bg-amber-300/20 text-amber-50",
                    )}
                  >
                    {delta <= 0 ? (
                      <TrendingDown className="size-3.5" />
                    ) : (
                      <TrendingUp className="size-3.5" />
                    )}
                    {percent} vs mes anterior
                  </span>
                ) : null}
              </>
            )}
          </div>
        </section>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Card className="space-y-3 p-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !hasReceipts ? (
          <div className="space-y-4">
            <EmptyState
              icon={<Camera className="size-6" />}
              title="Empieza con tu primer ticket"
              description="Hazle una foto al ticket de compra y la app leerá el comercio, la fecha y el total. Luego solo tienes que confirmar."
              action={
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/scan" className={buttonStyles()}>
                    <Camera className="size-4" />
                    Escanear ticket
                  </Link>
                  <Link
                    href="/receipts/new"
                    className={buttonStyles({ variant: "outline" })}
                  >
                    <Plus className="size-4" />
                    Añadir a mano
                  </Link>
                </div>
              }
            />

            {previousReceipts && previousReceipts.length > 0 ? (
              <p className="text-center text-xs text-muted">
                El mes pasado gastaste {formatEUR(previousTotal)} en{" "}
                {previousReceipts.length} tickets.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <section>
              <SectionTitle
                action={
                  <Link
                    href="/stats"
                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand"
                  >
                    Ver estadísticas
                    <ChevronRight className="size-3.5" />
                  </Link>
                }
              >
                Resumen por categoría
              </SectionTitle>

              <Card className="p-4">
                <CategoryDonut data={donutData} totalCents={summary.totalCents} />

                <ul className="mt-2 space-y-2.5">
                  {summary.byCategory.slice(0, 5).map((item) => {
                    const category = categoryMap.get(item.categoryId);
                    const share =
                      summary.totalCents > 0
                        ? Math.round((item.totalCents / summary.totalCents) * 100)
                        : 0;

                    return (
                      <li key={item.categoryId} className="flex items-center gap-3">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: category?.color ?? "#64748b" }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                          {category?.emoji} {category?.name ?? "Otros"}
                        </span>
                        <span className="tabular text-sm font-semibold text-ink">
                          {formatEUR(item.totalCents)}
                        </span>
                        <span className="tabular w-9 text-right text-xs text-muted">
                          {share} %
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>

            <section>
              <SectionTitle
                action={
                  <Link
                    href="/receipts"
                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand"
                  >
                    Ver todos
                    <ChevronRight className="size-3.5" />
                  </Link>
                }
              >
                Últimos tickets
              </SectionTitle>

              <div className="space-y-2">
                {receipts?.slice(0, 4).map((receipt) => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
              </div>
            </section>

            <Link
              href="/scan"
              className="flex items-center gap-3 rounded-2xl border border-dashed border-brand/30 bg-brand-soft/50 px-4 py-3.5 transition-colors active:bg-brand-soft"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white">
                <Camera className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">Escanear otro ticket</span>
                <span className="block text-xs text-muted">
                  Haz una foto y revisa los datos antes de guardar
                </span>
              </span>
              <ChevronRight className="size-4 text-brand" />
            </Link>

            {summary.count > 0 ? (
              <p className="flex items-center justify-center gap-1.5 pb-2 text-center text-[0.7rem] text-muted">
                <ReceiptText className="size-3.5" />
                Media de {formatEUR(summary.averageCents)} por ticket
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
