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
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { addMonths, currentMonth, isFutureMonth, isMonth } from "@/lib/dates";
import { ensureSeedData } from "@/lib/db";
import { AppLogo } from "@/components/app-logo";
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

const MONTH_STORAGE_KEY = "tiquet:selected-month";

function readInitialMonth() {
  const fallback = currentMonth();

  try {
    const stored = window.localStorage.getItem(MONTH_STORAGE_KEY);
    if (isMonth(stored) && !isFutureMonth(stored)) {
      return stored;
    }
  } catch {
    // localStorage puede estar deshabilitado en modo privado.
  }

  return fallback;
}

function MonthProvider({ children }: { children: ReactNode }) {
  // Este proveedor solo se monta en el cliente (ver AppProviders).
  const [month, setMonthValue] = useState<string>(readInitialMonth);

  const setMonth = useCallback((next: string) => {
    if (!isMonth(next) || isFutureMonth(next)) return;
    setMonthValue(next);
    try {
      window.localStorage.setItem(MONTH_STORAGE_KEY, next);
    } catch {
      // Sin persistencia: no es crítico.
    }
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
    ensureSeedData().catch((error) => {
      console.error(error);
      showToast(
        "No se ha podido preparar la base de datos local. Revisa el modo privado del navegador.",
        "error",
      );
    });

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker:", error);
      });
    }
  }, [showToast]);

  // La app depende de la fecha y del almacenamiento local del dispositivo.
  // Renderizamos la interfaz solo tras la hidratación para evitar que Next
  // evalúe `new Date()` durante el prerender estático.
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
      <MonthProvider>
        {children}
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
    </ToastContext.Provider>
  );
}
