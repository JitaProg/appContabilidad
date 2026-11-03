"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/providers";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallCard() {
  const { showToast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone)),
  );
  const [isIOS] = useState(
    () => typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent),
  );

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="size-5 shrink-0" />
        Tiquet ya está instalada en este dispositivo.
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <Button
        fullWidth
        onClick={async () => {
          await deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice.outcome === "accepted") {
            setInstalled(true);
            showToast("Instalando Tiquet…");
          }
          setDeferredPrompt(null);
        }}
      >
        <Download className="size-4" />
        Instalar Tiquet en el móvil
      </Button>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-paper px-4 py-3 text-sm text-ink-soft">
      {isIOS ? (
        <Share className="mt-0.5 size-5 shrink-0 text-brand" />
      ) : (
        <Smartphone className="mt-0.5 size-5 shrink-0 text-brand" />
      )}
      <p className="leading-relaxed">
        {isIOS ? (
          <>
            En Safari, toca <strong>Compartir</strong> y después{" "}
            <strong>Añadir a pantalla de inicio</strong>.
          </>
        ) : (
          <>
            Abre el menú del navegador y elige{" "}
            <strong>Instalar aplicación</strong> o{" "}
            <strong>Añadir a pantalla de inicio</strong>.
          </>
        )}
      </p>
    </div>
  );
}
