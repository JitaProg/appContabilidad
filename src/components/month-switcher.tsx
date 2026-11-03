"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { currentMonth, monthLabel } from "@/lib/dates";
import { useMonth } from "@/components/providers";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui";

export function MonthSwitcher({ className }: { className?: string }) {
  const { month, goPrev, goNext, canGoNext, setMonth } = useMonth();
  const isCurrent = month === currentMonth();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line bg-surface/80 p-1 backdrop-blur",
        className,
      )}
    >
      <IconButton
        aria-label="Mes anterior"
        onClick={goPrev}
        className="size-8 text-muted"
      >
        <ChevronLeft className="size-4" />
      </IconButton>
      <button
        type="button"
        onClick={() => setMonth(currentMonth())}
        className="min-w-[10.5rem] px-1 text-center text-sm font-semibold capitalize tracking-tight text-ink"
        title={isCurrent ? "Mes actual" : "Volver al mes actual"}
      >
        {monthLabel(month)}
      </button>
      <IconButton
        aria-label="Mes siguiente"
        onClick={goNext}
        disabled={!canGoNext}
        className="size-8 text-muted"
      >
        <ChevronRight className="size-4" />
      </IconButton>
    </div>
  );
}
