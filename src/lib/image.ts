export interface ProcessedImage {
  /** Imagen comprimida a color para guardar y mostrar. */
  full: Blob;
  /** Versión en escala de grises y con contraste para el OCR. */
  ocr: Blob;
  /** Miniatura para listados. */
  thumb: Blob;
  width: number;
  height: number;
}

interface Drawable {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

const FULL_MAX_SIZE = 1500;
const OCR_MAX_SIZE = 2200;
const THUMB_MAX_SIZE = 320;

async function loadDrawable(blob: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Safari antiguo o formato no soportado: probamos con <img>.
    }
  }

  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";
  image.src = url;

  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("No se ha podido leer la imagen.");
  }

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

function render(
  drawable: Drawable,
  options: { rotation: number; maxSize: number; filter?: string; background?: string },
) {
  const rotation = ((options.rotation % 360) + 360) % 360;
  const swap = rotation === 90 || rotation === 270;
  const scale = Math.min(1, options.maxSize / Math.max(drawable.width, drawable.height));
  const drawWidth = Math.max(1, Math.round(drawable.width * scale));
  const drawHeight = Math.max(1, Math.round(drawable.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = swap ? drawHeight : drawWidth;
  canvas.height = swap ? drawWidth : drawHeight;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se ha podido preparar la imagen.");

  if (options.background) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  if (options.filter) {
    try {
      context.filter = options.filter;
    } catch {
      // Navegador sin soporte de filtros canvas.
    }
  }

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(drawable.source, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se ha podido procesar la imagen."));
      },
      "image/jpeg",
      quality,
    );
  });
}

export async function processReceiptImage(
  file: Blob,
  rotation = 0,
): Promise<ProcessedImage> {
  const drawable = await loadDrawable(file);

  try {
    const fullCanvas = render(drawable, { rotation, maxSize: FULL_MAX_SIZE });
    const ocrCanvas = render(drawable, {
      rotation,
      maxSize: OCR_MAX_SIZE,
      filter: "grayscale(1) contrast(1.32) brightness(1.05)",
      background: "#ffffff",
    });
    const thumbCanvas = render(drawable, {
      rotation,
      maxSize: THUMB_MAX_SIZE,
      background: "#ffffff",
    });

    const [full, ocr, thumb] = await Promise.all([
      canvasToBlob(fullCanvas, 0.85),
      canvasToBlob(ocrCanvas, 0.92),
      canvasToBlob(thumbCanvas, 0.72),
    ]);

    return {
      full,
      ocr,
      thumb,
      width: fullCanvas.width,
      height: fullCanvas.height,
    };
  } finally {
    drawable.cleanup();
  }
}

export function createPreviewUrl(blob: Blob | null | undefined) {
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
