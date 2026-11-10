"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { BlobImage } from "@/components/blob-image";

const subscribeToNothing = () => () => {};

function useClientMounted() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  src: string | null | undefined;
  alt: string;
}

/**
 * Visor de fotos a pantalla completa.
 *
 * Se monta en `document.body` mediante un portal para escapar de cualquier
 * ancestro con `transform` (por ejemplo, `animate-rise`). Así el `fixed` se
 * calcula contra el viewport, queda centrado y su z-index no se queda atrapado
 * por debajo de la navegación inferior.
 */
export function ImageLightbox({ open, onClose, src, alt }: ImageLightboxProps) {
  const mounted = useClientMounted();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open || !src) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onClose}
        autoFocus
        aria-label="Cerrar foto"
        className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <X className="size-5" />
      </button>

      <div
        onClick={(event) => event.stopPropagation()}
        className="relative z-10 flex max-h-[calc(100dvh-8rem)] max-w-[calc(100vw-2rem)] items-center justify-center"
      >
        <BlobImage
          src={src}
          alt={alt}
          className="max-h-[calc(100dvh-8rem)] max-w-[calc(100vw-2rem)] rounded-2xl object-contain shadow-2xl"
        />
      </div>
    </div>,
    document.body,
  );
}
