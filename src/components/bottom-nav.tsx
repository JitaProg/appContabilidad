"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartPie, House, ReceiptText, ScanLine, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/receipts", label: "Tickets", icon: ReceiptText },
  { href: "/scan", label: "Escanear", icon: ScanLine, primary: true },
  { href: "/stats", label: "Stats", icon: ChartPie },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto w-full max-w-xl px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <nav
          aria-label="Navegación principal"
          className="pointer-events-auto grid grid-cols-5 items-end rounded-[30px] border border-line bg-white/95 px-1.5 pb-2 pt-2 shadow-[0_-10px_40px_rgba(18,33,29,0.10)] backdrop-blur-xl"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label="Escanear ticket"
                  className="group -mt-8 flex flex-col items-center gap-1"
                >
                  <span
                    className={cn(
                      "flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 ring-[5px] ring-paper transition-transform group-active:scale-95",
                      active && "bg-brand-dark",
                    )}
                  >
                    <Icon className="size-6" strokeWidth={2.2} />
                  </span>
                  <span className="text-[0.65rem] font-semibold text-brand">Escanear</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition-colors",
                  active ? "text-brand" : "text-muted hover:text-ink-soft",
                )}
              >
                <Icon className="size-[1.35rem]" strokeWidth={active ? 2.3 : 1.9} />
                <span className={cn("text-[0.65rem]", active ? "font-semibold" : "font-medium")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
