"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Lock,
  RotateCcw,
  RotateCw,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  Button,
  Card,
  Dialog,
  IconButton,
  ProgressBar,
} from "@/components/ui";
import { ReceiptForm, type ReceiptFormResult } from "@/components/receipt-form";
import { BlobImage } from "@/components/blob-image";
import { useToast } from "@/components/providers";
import { processReceiptImage, type ProcessedImage } from "@/lib/image";
import { preloadLanguage, runOcr, warmUpOcr } from "@/lib/ocr";
import { parseReceipt, type ParsedReceipt } from "@/lib/parser/receipt-parser";
import { guessCategory } from "@/lib/categories";
import { centsToInput, formatEUR } from "@/lib/money";
import { formatFullDate, todayISO } from "@/lib/dates";
import { createReceipt, findPossibleDuplicate } from "@/lib/db";
import { useRecentMerchants } from "@/lib/hooks";

type ScanStep = "capture" | "preview" | "processing" | "review";

interface PendingSave {
  result: ReceiptFormResult;
  duplicate: { merchant: string; purchaseDate: string; totalCents: number };
}

const EMPTY_PARSED: ParsedReceipt = {
  merchant: null,
  merchantConfidence: 0,
  date: null,
  dateConfidence: 0,
  totalCents: null,
  totalConfidence: 0,
  nif: null,
  vat: [],
  items: [],
  warnings: [],
  text: "",
  textConfidence: 0,
};

export default function ScanPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const merchants = useRecentMerchants();

  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ScanStep>("capture");
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);
  const [processed, setProcessed] = useState<ProcessedImage | null>(null);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [progress, setProgress] = useState({ label: "Preparando", value: 0 });
  const [error, setError] = useState<string | null>(null);
  const [extraWarnings, setExtraWarnings] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [saving, setSaving] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    preloadLanguage();
  }, []);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleFile(nextFile: File) {
    if (!nextFile.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (JPG, PNG o similar).");
      return;
    }
    if (nextFile.size > 20 * 1024 * 1024) {
      setError("La imagen es demasiado grande. Prueba con otra foto.");
      return;
    }

    setFile(nextFile);
    setRotation(0);
    setProcessed(null);
    setParsed(null);
    setError(null);
    setExtraWarnings([]);
    setStep("preview");
    warmUpOcr();
  }

  async function handleProcess() {
    if (!file) return;

    setStep("processing");
    setError(null);
    setProgress({ label: "Preparando la imagen", value: 5 });

    try {
      const image = await processReceiptImage(file, rotation);
      setProcessed(image);
      setProgress({ label: "Preparando el OCR", value: 10 });

      const ocr = await runOcr(image.ocr, (update) => {
        setProgress((current) => ({
          label: update.label,
          value: Math.max(current.value, progressForOcr(update.status, update.progress)),
        }));
      });

      setProgress({ label: "Interpretando el ticket", value: 98 });
      const result = parseReceipt(ocr.text, ocr.confidence);
      setParsed(result);
      setProgress({ label: "Listo", value: 100 });
      setStep("review");
    } catch (processError) {
      console.error(processError);
      setError(
        "No se ha podido leer el ticket. Revisa la foto o introdúcelo a mano.",
      );
      setStep("preview");
    }
  }

  async function handleManualFallback() {
    setError(null);
    setExtraWarnings([
      "No se ha leído el ticket automáticamente. Rellena los datos a mano; la foto se guardará igualmente.",
    ]);

    try {
      let image = processed;
      if (!image && file) {
        setStep("processing");
        setProgress({ label: "Preparando la imagen", value: 30 });
        image = await processReceiptImage(file, rotation);
        setProcessed(image);
      }
      setParsed({ ...EMPTY_PARSED });
      setStep("review");
    } catch {
      setError("No se ha podido procesar la foto.");
      setStep("preview");
    }
  }

  function resetToCapture() {
    setFile(null);
    setRotation(0);
    setProcessed(null);
    setParsed(null);
    setError(null);
    setExtraWarnings([]);
    setStep("capture");
  }

  const initialValues = useMemo(() => {
    if (!parsed) return {};
    return {
      purchaseDate: parsed.date ?? todayISO(),
      merchant: parsed.merchant ?? "",
      total: parsed.totalCents ? centsToInput(parsed.totalCents) : "",
      categoryId: guessCategory(`${parsed.merchant ?? ""} ${parsed.text.slice(0, 400)}`),
      merchantNif: parsed.nif ?? "",
      items: parsed.items.map((item) => ({
        description: item.description,
        amount: centsToInput(item.totalCents),
      })),
    };
  }, [parsed]);

  const warningFields = useMemo(() => {
    if (!parsed) return undefined;
    return {
      total: parsed.totalCents === null || parsed.totalConfidence < 0.5,
      merchant: !parsed.merchant || parsed.merchantConfidence < 0.5,
      date: !parsed.date || parsed.dateConfidence < 0.5,
    };
  }, [parsed]);

  async function saveReceipt(result: ReceiptFormResult, source: ParsedReceipt) {
    setSaving(true);
    try {
      const id = await createReceipt(
        {
          purchaseDate: result.purchaseDate,
          merchant: result.merchant,
          totalCents: result.totalCents,
          categoryId: result.categoryId,
          merchantNif: result.merchantNif,
          notes: result.notes,
          rawText: source.text || null,
          ocrConfidence: source.textConfidence || null,
          source: source.text ? "ocr" : "manual",
          vat: source.vat,
          image: processed?.full ?? null,
          thumb: processed?.thumb ?? null,
        },
        result.items,
      );

      showToast("Ticket guardado correctamente.");
      router.push(`/receipts/${id}`);
    } catch (saveError) {
      console.error(saveError);
      showToast("No se ha podido guardar el ticket.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(result: ReceiptFormResult) {
    if (!parsed) return;

    const duplicate = await findPossibleDuplicate({
      purchaseDate: result.purchaseDate,
      totalCents: result.totalCents,
      merchant: result.merchant,
    });

    if (duplicate) {
      setPendingSave({
        result,
        duplicate: {
          merchant: duplicate.merchant,
          purchaseDate: duplicate.purchaseDate,
          totalCents: duplicate.totalCents,
        },
      });
      return;
    }

    await saveReceipt(result, parsed);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Escanear ticket"
        subtitle={
          step === "capture"
            ? "Foto, datos y ticket digital"
            : step === "review"
              ? "Confirma los datos antes de guardar"
              : "Procesando en tu dispositivo"
        }
        action={
          step !== "capture" ? (
            <IconButton aria-label="Empezar de nuevo" onClick={resetToCapture}>
              <RotateCcw className="size-4" />
            </IconButton>
          ) : undefined
        }
      />

      <div className="px-5 pt-5">
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (next) handleFile(next);
            event.target.value = "";
          }}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (next) handleFile(next);
            event.target.value = "";
          }}
        />

        {step === "capture" ? (
          <div className="space-y-5">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const next = event.dataTransfer.files?.[0];
                if (next) handleFile(next);
              }}
              className={`relative overflow-hidden rounded-[28px] border-2 border-dashed px-5 py-9 text-center transition-colors ${
                dragging
                  ? "border-brand bg-brand-soft"
                  : "border-brand/25 bg-surface/70"
              }`}
            >
              <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-brand-soft text-brand">
                <ScanLine className="size-8" strokeWidth={1.8} />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight text-ink">
                Hazle una foto al ticket
              </h2>
              <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted">
                Leeremos el comercio, la fecha, los artículos y el total. Tú solo
                tienes que confirmarlo.
              </p>

              <div className="mt-6 grid gap-2">
                <Button size="lg" onClick={() => cameraInput.current?.click()}>
                  <Camera className="size-5" />
                  Abrir cámara
                </Button>
                <Button
                  variant="outline"
                  onClick={() => galleryInput.current?.click()}
                >
                  <ImageIcon className="size-4" />
                  Elegir de la galería
                </Button>
              </div>
            </div>

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <Card className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Sparkles className="size-4 text-brand" />
                Para que se lea bien
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm text-ink-soft">
                {[
                  "Coloca el ticket plano sobre una superficie clara.",
                  "Busca buena luz y evita sombras o reflejos.",
                  "Asegúrate de que se vea el total completo.",
                ].map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <p className="flex items-start justify-center gap-1.5 px-4 text-center text-[0.7rem] leading-relaxed text-muted">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              El OCR se ejecuta en tu dispositivo. La foto y los datos no salen de
              tu móvil.
            </p>

            <p className="text-center">
              <button
                type="button"
                onClick={() => router.push("/receipts/new")}
                className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
              >
                Prefiero introducirlo a mano
              </button>
            </p>
          </div>
        ) : null}

        {step === "preview" && previewUrl ? (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="flex max-h-[52vh] items-center justify-center overflow-hidden bg-ink/5 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Foto del ticket"
                  className="max-h-[48vh] w-auto max-w-full rounded-xl object-contain transition-transform duration-200"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
                <span className="text-xs text-muted">
                  Comprueba que el ticket se ve completo y derecho.
                </span>
                <div className="flex items-center gap-0.5">
                  <IconButton
                    aria-label="Girar a la izquierda"
                    onClick={() => setRotation((current) => current - 90)}
                  >
                    <RotateCcw className="size-4" />
                  </IconButton>
                  <IconButton
                    aria-label="Girar a la derecha"
                    onClick={() => setRotation((current) => current + 90)}
                  >
                    <RotateCw className="size-4" />
                  </IconButton>
                </div>
              </div>
            </Card>

            {error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">{error}</p>
                <button
                  type="button"
                  onClick={handleManualFallback}
                  className="mt-1 font-semibold text-brand underline underline-offset-2"
                >
                  Rellenar los datos a mano
                </button>
              </div>
            ) : null}

            <Button size="lg" fullWidth onClick={handleProcess}>
              <ScanLine className="size-5" />
              Leer el ticket
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => cameraInput.current?.click()}
              >
                <Camera className="size-4" />
                Repetir foto
              </Button>
              <Button
                variant="outline"
                onClick={() => galleryInput.current?.click()}
              >
                <ImageIcon className="size-4" />
                Otra imagen
              </Button>
            </div>

            <p className="text-center text-[0.7rem] leading-relaxed text-muted">
              La primera vez se descarga el motor OCR (unos 4 MB) y el diccionario
              español (2 MB). Después queda en caché y funciona sin conexión.
            </p>
          </div>
        ) : null}

        {step === "processing" ? (
          <div className="flex flex-col items-center py-10">
            <div className="relative flex size-24 items-center justify-center rounded-full bg-brand-soft">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand/10" />
              <Loader2 className="size-10 animate-spin text-brand" />
            </div>

            <h2 className="mt-6 text-lg font-semibold text-ink">Leyendo el ticket…</h2>
            <p className="mt-1 text-center text-sm text-muted">
              Suele tardar entre 5 y 15 segundos.
            </p>

            <div className="mt-8 w-full">
              <ProgressBar value={progress.value} label={progress.label} />
            </div>

            <p className="mt-6 max-w-xs text-center text-[0.7rem] leading-relaxed text-muted">
              No cierres esta pantalla. El reconocimiento se está ejecutando en tu
              dispositivo.
            </p>
          </div>
        ) : null}

        {step === "review" && parsed ? (
          <div className="space-y-4">
            <Card className="flex items-center gap-3 p-3">
              {processed ? (
                <BlobImage
                  blob={processed.thumb}
                  alt="Ticket escaneado"
                  className="size-16 shrink-0 rounded-xl border border-line"
                />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-paper-deep text-muted">
                  <ImageIcon className="size-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {parsed.textConfidence > 0
                    ? `Texto leído con ${Math.round(parsed.textConfidence)} % de confianza`
                    : "Datos introducidos a mano"}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {parsed.text
                    ? "Revisa los campos marcados en ámbar."
                    : "La foto se guardará con el ticket."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("preview")}
                className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-brand"
              >
                Repetir
              </button>
            </Card>

            {parsed.text ? (
              <details className="rounded-2xl border border-line bg-surface px-4 py-3">
                <summary className="cursor-pointer list-none text-xs font-semibold text-muted">
                  Ver el texto completo leído por el OCR
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[0.68rem] leading-relaxed text-ink-soft">
                  {parsed.text}
                </pre>
              </details>
            ) : null}

            <ReceiptForm
              initial={initialValues}
              submitLabel="Guardar ticket"
              busy={saving}
              warningFields={warningFields}
              warnings={[...parsed.warnings, ...extraWarnings]}
              merchantSuggestions={merchants ?? []}
              onSubmit={handleSubmit}
              onCancel={resetToCapture}
              cancelLabel="Descartar y hacer otra foto"
            />
          </div>
        ) : null}
      </div>

      <Dialog
        open={pendingSave !== null}
        onClose={() => setPendingSave(null)}
        title="Puede ser un duplicado"
        description={
          pendingSave
            ? `Ya tienes un ticket de ${pendingSave.duplicate.merchant} del ${formatFullDate(
                pendingSave.duplicate.purchaseDate,
              )} por ${formatEUR(
                pendingSave.duplicate.totalCents,
              )}. ¿Quieres guardarlo igualmente?`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" fullWidth onClick={() => setPendingSave(null)}>
              Cancelar
            </Button>
            <Button
              fullWidth
              onClick={async () => {
                if (!pendingSave || !parsed) return;
                const pending = pendingSave;
                setPendingSave(null);
                await saveReceipt(pending.result, parsed);
              }}
            >
              Guardar igual
            </Button>
          </>
        }
      />
    </div>
  );
}

function progressForOcr(status: string, progress: number) {
  const value = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;

  switch (status) {
    case "loading tesseract core":
      return 8 + value * 25;
    case "loading language traineddata":
      return 33 + value * 22;
    case "initializing api":
    case "initializing tesseract":
      return 55 + value * 15;
    case "recognizing text":
      return 70 + value * 27;
    default:
      return 10 + value * 60;
  }
}
