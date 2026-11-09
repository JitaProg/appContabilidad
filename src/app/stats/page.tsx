"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDownRight, ArrowUpRight, ChartPie, Store, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MonthSwitcher } from "@/components/month-switcher";
import { MonthlyBars } from "@/components/charts";
import { Card, EmptyState, SectionTitle, Skeleton } from "@/components/ui";
import { useMonth, useMounted } from "@/components/providers";
import { receiptsBetween } from "@/lib/db";
import {
  addMonths,
  daysInMonth,
  monthDateRange,
  monthLabel,
  monthShortLabel,
} from "@/lib/dates";
import { formatEUR, formatPercentChange } from "@/lib/money";
import { monthlySeries, summarizeMonth } from "@/lib/stats";
import { cn } from "@/lib/utils";

export default function StatsPage() {
  const { month, ready } = useMonth();
  const mounted = useMounted();

  const startMonth = addMonths(month, -11);
  const start = monthDateRange(startMonth).start;
  const end = `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;

  const receipts = useLiveQuery(() => receiptsBetween(start, end), [start, end]);

  const summary = useMemo(
    () => summarizeMonth(month, receipts ?? []),
    [month, receipts],
  );
  const previous = useMemo(
    () => summarizeMonth(addMonths(month, -1), receipts ?? []),
    [month, receipts],
  );

  const series = useMemo(
    () =>
      monthlySeries(receipts ?? [], 12, month).map((point) => ({
        month: point.month,
        label: monthShortLabel(point.month),
        totalCents: point.totalCents,
      })),
    [month, receipts],
  );

  const hasAnyData = (receipts?.length ?? 0) > 0;
  const loading = !ready || receipts === undefined;
  const delta = summary.totalCents - previous.totalCents;

  return (
    <div className="animate-rise">
      <PageHeader title="Estadísticas" subtitle="Dónde se va tu dinero" />

      <div className="space-y-6 px-5 pt-4">
        <MonthSwitcher />

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        ) : !hasAnyData ? (
          <EmptyState
            icon={<ChartPie className="size-6" />}
            title="Aún no hay estadísticas"
            description="Cuando guardes tickets verás aquí la evolución mensual y los comercios donde más gastas."
          />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3">
              <Card className="col-span-2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                      Total de {monthLabel(month)}
                    </p>
                    <p className="tabular mt-1 text-[2rem] font-semibold leading-none tracking-tight text-ink">
                      {formatEUR(summary.totalCents)}
                    </p>
                  </div>

                  {previous.totalCents > 0 ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                        delta <= 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {delta <= 0 ? (
                        <ArrowDownRight className="size-3.5" />
                      ) : (
                        <ArrowUpRight className="size-3.5" />
                      )}
                      {formatPercentChange(summary.totalCents, previous.totalCents)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-muted">
                  {summary.count} {summary.count === 1 ? "ticket" : "tickets"} · mes
                  anterior: {formatEUR(previous.totalCents)}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-xs text-muted">Media por ticket</p>
                <p className="tabular mt-1 text-xl font-semibold text-ink">
                  {formatEUR(summary.averageCents)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted">Media diaria</p>
                <p className="tabular mt-1 text-xl font-semibold text-ink">
                  {formatEUR(summary.dailyAverageCents)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted">Ticket más alto</p>
                <p className="tabular mt-1 text-xl font-semibold text-ink">
                  {formatEUR(summary.largestCents)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted">Comercios</p>
                <p className="tabular mt-1 text-xl font-semibold text-ink">
                  {summary.merchantCount}
                </p>
              </Card>
            </section>

            <section>
              <SectionTitle>Evolución de los últimos 12 meses</SectionTitle>
              <Card className="p-4">
                {mounted ? (
                  <MonthlyBars data={series} selectedMonth={month} />
                ) : (
                  <Skeleton className="h-48 w-full" />
                )}
              </Card>
            </section>

            {summary.topMerchants.length > 0 ? (
              <section>
                <SectionTitle>Comercios con más gasto</SectionTitle>
                <Card className="divide-y divide-line">
                  {summary.topMerchants.map((merchant, index) => (
                    <div
                      key={merchant.merchant}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span className="tabular flex size-7 shrink-0 items-center justify-center rounded-full bg-paper-deep text-xs font-semibold text-muted">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {merchant.merchant}
                        </p>
                        <p className="text-xs text-muted">
                          {merchant.count} {merchant.count === 1 ? "ticket" : "tickets"}
                        </p>
                      </div>
                      <span className="tabular text-sm font-semibold text-ink">
                        {formatEUR(merchant.totalCents)}
                      </span>
                    </div>
                  ))}
                </Card>
              </section>
            ) : null}

            <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface/70 px-4 py-3 text-xs leading-relaxed text-muted">
              <Store className="mt-0.5 size-4 shrink-0 text-brand" />
              <p>
                Los importes salen del precio final de tus tickets. Si un ticket
                incluye devoluciones o descuentos, edítalo para que el total sea
                exacto.
              </p>
            </div>

            <p className="flex items-center justify-center gap-1.5 pb-2 text-[0.7rem] text-muted">
              <TrendingUp className="size-3.5" />
              {summary.count} {summary.count === 1 ? "ticket" : "tickets"} este mes
            </p>
          </>
        )}
      </div>
    </div>
  );
}
