"use client";

import { useRef, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  Lock,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { centsToInput, parseAmountToCents } from "@/lib/money";
import { todayISO } from "@/lib/dates";
import { processReceiptImage, type ProcessedImage } from "@/lib/image";
import { Button, Field, IconButton, Input } from "@/components/ui";
import { BlobImage } from "@/components/blob-image";
import { cn } from "@/lib/utils";

export interface ReceiptFormValues {
  purchaseDate: string;
  merchant: string;
  total: string;
}

export interface ReceiptFormResult {
  purchaseDate: string;
  merchant: string;
  totalCents: number;
  image: Blob | null;
  thumb: Blob | null;
}

interface ReceiptFormProps {
  initial?: Partial<ReceiptFormValues>;
  initialImage?: Blob | null;
  initialThumb?: Blob | null;
  submitLabel: string;
  busy?: boolean;
  merchantSuggestions?: string[];
  onSubmit: (result: ReceiptFormResult) => Promise<void> | void;
  onCancel?: () => void;
  cancelLabel?: string;
}

export function ReceiptForm({
  initial,
  initialImage = null,
  initialThumb = null,
  submitLabel,
  busy = false,
  merchantSuggestions = [],
  onSubmit,
  onCancel,
  cancelLabel = "Cancelar",
}: ReceiptFormProps) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const processRequest = useRef(0);

  const [values, setValues] = useState<ReceiptFormValues>(() => ({
    purchaseDate: initial?.purchaseDate ?? todayISO(),
    merchant: initial?.merchant ?? "",
    total: initial?.total ?? "",
  }));
  const [file, setFile] = useState<File | null>(null);
  const [processed, setProcessed] = useState<ProcessedImage | null>(null);
  const [rotation, setRotation] = useState(0);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    merchant?: string;
    total?: string;
    photo?: string;
  }>({});
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalCents = parseAmountToCents(values.total);
  const preview = processed?.full ?? initialImage;
  const hasPhoto = preview !== null;

  function update<K extends keyof ReceiptFormValues>(
    key: K,
    value: ReceiptFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function normalizeTotal() {
    const cents = parseAmountToCents(values.total);
    if (cents !== null && cents > 0) {
      update("total", centsToInput(cents));
    }
  }

  async function prepareFile(nextFile: File, nextRotation: number) {
    const requestId = processRequest.current + 1;
    processRequest.current = requestId;
    setProcessingPhoto(true);
    setPhotoError(null);

    try {
      const result = await processReceiptImage(nextFile, nextRotation);
      if (requestId === processRequest.current) {
        setProcessed(result);
      }
    } catch (error) {
      console.error(error);
      if (requestId === processRequest.current) {
        setProcessed(null);
        setPhotoError("No se ha podido preparar la foto. Prueba con otra imagen.");
      }
    } finally {
      if (requestId === processRequest.current) {
        setProcessingPhoto(false);
      }
    }
  }

  function handleFile(nextFile: File) {
    if (!nextFile.type.startsWith("image/")) {
      setPhotoError("El archivo debe ser una imagen (JPG, PNG o similar).");
      return;
    }
    if (nextFile.size > 20 * 1024 * 1024) {
      setPhotoError("La imagen es demasiado grande. Prueba con otra foto.");
      return;
    }

    setFile(nextFile);
    setProcessed(null);
    setRotation(0);
    setErrors((current) => ({ ...current, photo: undefined }));
    void prepareFile(nextFile, 0);
  }

  function rotate(delta: number) {
    if (!file || processingPhoto) return;
    const nextRotation = rotation + delta;
    setRotation(nextRotation);
    void prepareFile(file, nextRotation);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: typeof errors = {};
    if (!values.merchant.trim()) nextErrors.merchant = "Indica el comercio.";
    if (totalCents === null || totalCents <= 0) {
      nextErrors.total = "Introduce un importe válido.";
    }
    if (file && !processed) {
      setPhotoError("La foto aún no está lista. Prueba a elegir otra imagen.");
      return;
    }
    if (!file && !initialImage) {
      nextErrors.photo = "Añade una foto del ticket.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      await onSubmit({
        purchaseDate: values.purchaseDate || todayISO(),
        merchant: values.merchant.trim(),
        totalCents: totalCents as number,
        image: processed?.full ?? initialImage ?? null,
        thumb: processed?.thumb ?? initialThumb ?? null,
      });
    } catch (error) {
      console.error(error);
      setSubmitError("No se ha podido guardar el ticket. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  const disabled = busy || pending || processingPhoto;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
        className={cn(
          "overflow-hidden rounded-3xl border bg-surface",
          errors.photo || photoError
            ? "border-red-300"
            : dragging
              ? "border-brand bg-brand-soft/40"
              : "border-line",
        )}
      >
        {processingPhoto && !preview ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <Loader2 className="size-8 animate-spin text-brand" />
            <p className="text-sm font-medium text-ink">Preparando la foto…</p>
          </div>
        ) : preview ? (
          <>
            <div className="flex max-h-[48vh] items-center justify-center overflow-hidden bg-ink/5 p-3">
              <BlobImage
                blob={preview}
                alt="Foto del ticket"
                className="max-h-[44vh] w-auto max-w-full rounded-2xl object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
              <span className="text-xs text-muted">
                Esta foto se guardará con el ticket.
              </span>
              {file ? (
                <div className="flex items-center gap-0.5">
                  <IconButton
                    aria-label="Girar a la izquierda"
                    onClick={() => rotate(-90)}
                    disabled={processingPhoto}
                  >
                    <RotateCcw className="size-4" />
                  </IconButton>
                  <IconButton
                    aria-label="Girar a la derecha"
                    onClick={() => rotate(90)}
                    disabled={processingPhoto}
                  >
                    <RotateCw className="size-4" />
                  </IconButton>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-brand-soft text-brand">
              <Camera className="size-8" strokeWidth={1.8} />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-ink">
              Haz una foto del ticket
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted">
              Después solo tienes que apuntar el importe final, el comercio y la
              fecha.
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
        )}
      </div>

      {hasPhoto ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => cameraInput.current?.click()}
            disabled={disabled}
          >
            <Camera className="size-4" />
            Repetir foto
          </Button>
          <Button
            variant="outline"
            onClick={() => galleryInput.current?.click()}
            disabled={disabled}
          >
            <ImageIcon className="size-4" />
            Otra imagen
          </Button>
        </div>
      ) : null}

      {errors.photo || photoError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {photoError ?? errors.photo}
        </p>
      ) : null}

      <div
        className={cn(
          "rounded-3xl border border-line bg-surface p-4",
          errors.total && "border-red-300 ring-2 ring-red-200/50",
        )}
      >
        <label htmlFor="total" className="text-sm font-medium text-ink-soft">
          Importe final del ticket
        </label>
        <div className="mt-1 flex items-baseline gap-2">
          <input
            id="total"
            inputMode="decimal"
            placeholder="0,00"
            value={values.total}
            onChange={(event) => update("total", event.target.value)}
            onBlur={normalizeTotal}
            className="tabular w-full min-w-0 bg-transparent text-4xl font-semibold tracking-tight text-ink outline-none placeholder:text-muted/40"
          />
          <span className="text-3xl font-semibold text-muted">€</span>
        </div>
        {errors.total ? (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.total}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">
            El precio total que aparece en el ticket.
          </p>
        )}
      </div>

      <div className="grid gap-4">
        <Field label="Comercio" htmlFor="merchant">
          <Input
            id="merchant"
            list="merchant-suggestions"
            placeholder="Mercadona, Repsol, Bar Pepe…"
            value={values.merchant}
            onChange={(event) => {
              update("merchant", event.target.value);
              if (errors.merchant) {
                setErrors((current) => ({ ...current, merchant: undefined }));
              }
            }}
            className={cn(
              errors.merchant && "border-red-300 ring-2 ring-red-200/50",
            )}
            autoComplete="off"
          />
          <datalist id="merchant-suggestions">
            {merchantSuggestions.map((merchant) => (
              <option key={merchant} value={merchant} />
            ))}
          </datalist>
          {errors.merchant ? (
            <p className="text-xs font-medium text-red-600">{errors.merchant}</p>
          ) : null}
        </Field>

        <Field
          label="Fecha del ticket"
          htmlFor="purchaseDate"
          hint="Si la dejas vacía, se usará la fecha de hoy."
        >
          <Input
            id="purchaseDate"
            type="date"
            max={todayISO()}
            value={values.purchaseDate}
            onChange={(event) => update("purchaseDate", event.target.value)}
          />
        </Field>
      </div>

      <p className="flex items-start justify-center gap-1.5 px-4 text-center text-[0.7rem] leading-relaxed text-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        La foto y los datos se guardan solo en este dispositivo. No se envían a
        ningún servidor.
      </p>

      {submitError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 pt-1">
        <Button type="submit" size="lg" fullWidth disabled={disabled}>
          {disabled ? <Loader2 className="size-5 animate-spin" /> : null}
          {processingPhoto ? "Preparando foto…" : pending ? "Guardando…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} disabled={disabled}>
            {cancelLabel}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
