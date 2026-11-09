"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { addMonths, currentMonth, isFutureMonth, isMonth } from "@/lib/dates";
import { AppLogo } from "@/components/app-logo";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { ReceiptsProvider } from "@/components/receipts-provider";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                    Toasts                                  */
/* -------------------------------------------------------------------------- */

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<ToastKind, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-line bg-white text-ink",
};

const TOAST_ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />,
  error: <AlertTriangle className="size-5 shrink-0 text-red-600" />,
  info: <Info className="size-5 shrink-0 text-brand" />,
};

/* -------------------------------------------------------------------------- */
/*                                    Mes                                    */
/* -------------------------------------------------------------------------- */

interface MonthContextValue {
  month: string;
  ready: boolean;
  setMonth: (month: string) => void;
  goPrev: () => void;
  goNext: () => void;
  canGoNext: boolean;
}

const MonthContext = createContext<MonthContextValue | null>(null);

function MonthProvider({ children }: { children: ReactNode }) {
  // Este proveedor solo se monta en el cliente (ver AppProviders).
  const [month, setMonthValue] = useState<string>(currentMonth);

  const setMonth = useCallback((next: string) => {
    if (!isMonth(next) || isFutureMonth(next)) return;
    setMonthValue(next);
  }, []);

  const value = useMemo<MonthContextValue>(
    () => ({
      month,
      ready: true,
      setMonth,
      goPrev: () => setMonth(addMonths(month, -1)),
      goNext: () => {
        if (month < currentMonth()) setMonth(addMonths(month, 1));
      },
      canGoNext: month < currentMonth(),
    }),
    [month, setMonth],
  );

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/*                              Pantallas de estado                           */
/* -------------------------------------------------------------------------- */

function Splash({ message = "Cargando tu cuenta…" }: { message?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper text-ink">
      <AppLogo className="size-16 rounded-[22px]" />
      <div className="text-center">
        <p className="text-lg font-semibold tracking-tight">Tiquet</p>
        <p className="mt-0.5 flex items-center justify-center gap-2 text-sm text-muted">
          <Loader2 className="size-3.5 animate-spin" />
          {message}
        </p>
      </div>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-paper px-6 text-center text-ink">
      <AppLogo className="size-16 rounded-[22px]" />
      <div>
        <p className="text-lg font-semibold tracking-tight">Tiquet</p>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Falta conectar Supabase
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Añade <code className="rounded bg-paper-deep px-1">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="rounded bg-paper-deep px-1">
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          </code>{" "}
          en <code className="rounded bg-paper-deep px-1">.env.local</code>, reinicia el
          servidor y vuelve a cargar la app.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Protección                                  */
/* -------------------------------------------------------------------------- */

function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = pathname === "/login" || pathname.startsWith("/auth/");
  const mustLogin = !isPublic && !loading && !user;

  useEffect(() => {
    if (!mustLogin) return;
    const next = encodeURIComponent(pathname || "/");
    router.replace(`/login?next=${next}`);
  }, [mustLogin, pathname, router]);

  if (isPublic) return <>{children}</>;
  if (!configured) return <SetupScreen />;
  if (loading || mustLogin || !user) {
    return <Splash message={mustLogin ? "Te llevamos al inicio de sesión…" : undefined} />;
  }

  return <ReceiptsProvider>{children}</ReceiptsProvider>;
}

/* -------------------------------------------------------------------------- */
/*                                 Proveedores                                */
/* -------------------------------------------------------------------------- */

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de AppProviders");
  return context;
}

export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) throw new Error("useMonth debe usarse dentro de AppProviders");
  return context;
}

const subscribeToNothing = () => () => {};

/** `false` en el servidor y `true` tras hidratar, sin efectos ni parpadeos. */
export function useMounted() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const timers = useRef<number[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = "success") => {
    counter.current += 1;
    const id = counter.current;
    setToasts((current) => [...current, { id, message, kind }]);
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3800);
    timers.current.push(timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker:", error);
      });
    }
  }, []);

  // La interfaz depende de la fecha y de la sesión del navegador. Renderizamos
  // solo tras la hidratación para evitar que Next evalúe `new Date()` durante
  // el prerender estático.
  if (!mounted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper text-ink">
        <AppLogo className="size-16 rounded-[22px]" />
        <div className="text-center">
          <p className="text-lg font-semibold tracking-tight">Tiquet</p>
          <p className="mt-0.5 text-sm text-muted">Preparando tus datos…</p>
        </div>
      </div>
    );
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      <AuthProvider>
        <MonthProvider>
          <AuthGate>{children}</AuthGate>
          <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                role="status"
                className={cn(
                  "pointer-events-auto flex w-full max-w-md animate-rise items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg shadow-ink/5",
                  TOAST_STYLES[toast.kind],
                )}
              >
                {TOAST_ICONS[toast.kind]}
                <span className="leading-snug">{toast.message}</span>
              </div>
            ))}
          </div>
        </MonthProvider>
      </AuthProvider>
    </ToastContext.Provider>
  );
}
