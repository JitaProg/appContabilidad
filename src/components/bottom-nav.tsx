"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, ChartPie, House, ReceiptText, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { isPublicPath } from "@/lib/public-routes";
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
  { href: "/receipts/new", label: "Añadir", icon: Camera, primary: true },
  { href: "/stats", label: "Stats", icon: ChartPie },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  if (isPublicPath(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto w-full max-w-xl px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <nav
          aria-label="Navegación principal"
          className="pointer-events-auto flex items-center justify-between gap-1 rounded-3xl border border-line bg-surface/95 px-2 py-1.5 shadow-[0_12px_40px_rgba(18,33,29,0.14)] backdrop-blur"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/receipts"
                  ? pathname === "/receipts" || /^\/receipts\/[^/]+/.test(pathname)
                  : pathname === item.href;

            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="-mt-4 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30 transition-transform active:scale-95"
                >
                  <item.icon className="size-5" strokeWidth={2.1} />
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[0.62rem] font-medium transition-colors",
                  active ? "text-brand" : "text-muted hover:text-ink-soft",
                )}
              >
                <item.icon
                  className={cn("size-5", active && "text-brand")}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
