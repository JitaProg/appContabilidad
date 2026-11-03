import { createWorker, PSM, type Worker as TesseractWorker } from "tesseract.js";

export interface OcrProgress {
  status: string;
  progress: number;
  label: string;
}

export interface OcrResult {
  text: string;
  confidence: number;
}

const STATUS_LABELS: Record<string, string> = {
  "loading tesseract core": "Cargando motor OCR",
  "initializing tesseract": "Iniciando el motor OCR",
  "loading language traineddata": "Cargando diccionario español",
  "initializing api": "Preparando el análisis",
  "recognizing text": "Leyendo el ticket",
};

let workerPromise: Promise<TesseractWorker> | null = null;
let progressHandler: ((progress: OcrProgress) => void) | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("spa", 1, {
      langPath: "/tessdata",
      logger: (message) => {
        const status = String(message.status ?? "");
        progressHandler?.({
          status,
          progress: typeof message.progress === "number" ? message.progress : 0,
          label: STATUS_LABELS[status] ?? "Procesando",
        });
      },
      errorHandler: (error) => {
        console.error("[ocr]", error);
      },
    })
      .then(async (worker) => {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          preserve_interword_spaces: "1",
        });
        return worker;
      })
      .catch((error) => {
        workerPromise = null;
        throw error;
      });
  }

  return workerPromise;
}

/** Precalienta el motor OCR (opcional) para que el primer ticket tarde menos. */
export async function warmUpOcr() {
  try {
    await getWorker();
  } catch {
    // Silencioso: se reintenta al procesar una imagen.
  }
}

export async function runOcr(
  image: Blob,
  onProgress?: (progress: OcrProgress) => void,
): Promise<OcrResult> {
  const worker = await getWorker();
  progressHandler = onProgress ?? null;

  try {
    const result = await worker.recognize(image);
    return {
      text: result.data.text ?? "",
      confidence: typeof result.data.confidence === "number" ? result.data.confidence : 0,
    };
  } finally {
    progressHandler = null;
  }
}

export function preloadLanguage() {
  // Tesseract.js cachea el traineddata en IndexedDB tras la primera carga.
  // Este fetch ayuda a que la descarga quede también en la caché HTTP/SW.
  if (typeof fetch === "function") {
    fetch("/tessdata/spa.traineddata.gz").catch(() => undefined);
  }
}
