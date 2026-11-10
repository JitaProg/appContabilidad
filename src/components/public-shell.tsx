import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { AppLogo } from "@/components/app-logo";

const LEGAL_LINKS = [
  { href: "/about", label: "Sobre Tiquet" },
  { href: "/privacy", label: "Privacidad" },
  { href: "/terms", label: "Términos" },
];

export const LEGAL_CONTACT_EMAIL = "borjablp2@gmail.com";

interface PublicShellProps {
  title: string;
  intro: string;
  updated?: string;
  children: ReactNode;
}

/**
 * Marco común de las páginas informativas. Es un componente de servidor para
 * que el contenido llegue en el HTML inicial, sin depender de hidratación.
 */
export function PublicShell({ title, intro, updated, children }: PublicShellProps) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-line bg-surface/70">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
          <Link
            href="/about"
            className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <AppLogo className="size-10 rounded-xl" />
            <span>
              <span className="block text-sm font-semibold tracking-tight text-ink">
                Tiquet
              </span>
              <span className="block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted">
                Contabilidad personal
              </span>
            </span>
          </Link>

          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-paper-deep/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Entrar
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-10 sm:px-6 sm:pt-14">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brand">
          Información
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {intro}
        </p>
        {updated ? (
          <p className="mt-2 text-xs text-muted">Última actualización: {updated}</p>
        ) : null}

        <div className="mt-10 space-y-9">{children}</div>

        <div className="mt-12 flex flex-col gap-3 rounded-2xl border border-line bg-surface/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-semibold text-ink">¿Tienes alguna duda?</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Escríbenos y te responderemos lo antes posible.
            </p>
          </div>
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Mail className="size-4" />
            Contactar
          </a>
        </div>
      </main>

      <footer className="border-t border-line bg-surface/60">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Tiquet · Hecho para llevar tus gastos sin complicaciones.</p>
          <nav aria-label="Enlaces legales" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium text-ink-soft transition-colors hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

interface PublicSectionProps {
  title: string;
  children: ReactNode;
}

export function PublicSection({ title, children }: PublicSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export function PublicList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-brand">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
