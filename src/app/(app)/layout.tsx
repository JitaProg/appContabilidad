import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers";
import { BottomNav } from "@/components/bottom-nav";

/**
 * Layout de la aplicación con sesión: providers, splash de carga, navegación
 * inferior y ancho máximo de móvil. Las páginas informativas viven fuera de
 * este grupo para servirse sin providers y sin depender de JavaScript.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
        <main className="flex-1 pb-32">{children}</main>
        <BottomNav />
      </div>
    </AppProviders>
  );
}
