"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { useAuth } from "@/components/auth-provider";
import { buttonStyles } from "@/components/ui";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.68-.06-1.34-.18-1.97H12v3.72h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.32 2.98-7.27Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.9a6 6 0 0 1 0-3.8V7.52H3.06a10 10 0 0 0 0 8.96l3.35-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.94 5.52l3.35 2.58C7.2 7.74 9.4 5.98 12 5.98Z"
      />
    </svg>
  );
}

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return "/";
  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, configured, signInWithGoogle } = useAuth();

  const [next] = useState(() => {
    if (typeof window === "undefined") return "/";
    return safeNextPath(new URLSearchParams(window.location.search).get("next"));
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    if (!params.get("error")) return null;
    return "No se ha completado el inicio de sesión. Inténtalo de nuevo.";
  });

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  async function handleGoogle() {
    setError(null);
    setPending(true);

    try {
      await signInWithGoogle(next);
    } catch (caught) {
      console.error(caught);
      setError("No se ha podido conectar con Google. Inténtalo de nuevo.");
      setPending(false);
    }
  }

  if (!configured) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <AppLogo className="size-16 rounded-[22px]" />
        <div>
          <p className="text-lg font-semibold tracking-tight text-ink">Tiquet</p>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
            Falta conectar Supabase
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Configura las variables de entorno de Supabase para poder iniciar sesión
            con Google.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col justify-between px-6 pb-10 pt-[calc(env(safe-area-inset-top)+4rem)]">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <AppLogo className="size-20 rounded-[26px] shadow-lg shadow-brand/20" />
          <p className="mt-6 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brand">
            Tu contabilidad personal
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Tiquet</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Guarda la foto de cada ticket y consulta lo que gastas cada mes. Tus
            datos se sincronizan de forma privada con tu cuenta de Google.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={pending || loading}
            className={buttonStyles({
              size: "lg",
              fullWidth: true,
              className:
                "border border-line bg-white text-ink shadow-sm hover:bg-white/80",
            })}
          >
            {pending ? (
              <Loader2 className="size-5 animate-spin text-muted" />
            ) : (
              <GoogleIcon />
            )}
            {pending ? "Conectando con Google…" : "Continuar con Google"}
          </button>

          {error ? (
            <p className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-8 space-y-3 rounded-2xl border border-line bg-surface/70 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
            <p className="text-xs leading-relaxed text-muted">
              Solo se usa tu cuenta de Google para identificarte. Nadie más puede
              ver tus tickets: cada cuenta tiene su propio espacio privado.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-sm text-center text-[0.7rem] leading-relaxed text-muted">
        <p>
          Al continuar aceptas los{" "}
          <Link
            href="/terms"
            className="font-semibold text-ink-soft underline-offset-2 hover:text-brand hover:underline"
          >
            términos de uso
          </Link>{" "}
          y la{" "}
          <Link
            href="/privacy"
            className="font-semibold text-ink-soft underline-offset-2 hover:text-brand hover:underline"
          >
            política de privacidad
          </Link>
          . Puedes exportar o borrar tus datos cuando quieras desde Ajustes.
        </p>
        <nav
          aria-label="Enlaces informativos"
          className="mt-3 flex items-center justify-center gap-3"
        >
          <Link href="/about" className="font-medium hover:text-brand">
            Sobre Tiquet
          </Link>
          <span aria-hidden="true" className="text-line">
            ·
          </span>
          <Link href="/privacy" className="font-medium hover:text-brand">
            Privacidad
          </Link>
          <span aria-hidden="true" className="text-line">
            ·
          </span>
          <Link href="/terms" className="font-medium hover:text-brand">
            Términos
          </Link>
        </nav>
      </div>
    </div>
  );
}
