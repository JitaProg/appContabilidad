import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="safe-top sticky top-0 z-30 -mx-0 border-b border-line/60 bg-paper/85 px-5 pb-3 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Volver"
            className="-ml-2 mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper-deep"
          >
            <ArrowLeft className="size-5" />
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-brand">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="truncate text-[1.55rem] font-semibold leading-tight tracking-tight text-ink">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>

        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
      </div>
    </header>
  );
}
