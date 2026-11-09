"use client";

import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";

export function BlobImage({
  blob,
  src,
  alt,
  className,
  style,
  onClick,
}: {
  blob?: Blob | null;
  src?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- la URL es un recurso externo que hay que liberar
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const url = blob ? objectUrl : (src ?? null);

  if (!blob && !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-paper-deep text-muted",
          className,
        )}
      >
        <ReceiptText className="size-5" />
      </div>
    );
  }

  if (!url) {
    return <div className={cn("skeleton", className)} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      onClick={onClick}
      style={style}
      className={cn("object-cover", onClick && "cursor-zoom-in", className)}
    />
  );
}
