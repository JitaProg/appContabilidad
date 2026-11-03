"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";
import { centsToInput, formatEUR, parseAmountToCents } from "@/lib/money";
import { guessCategory } from "@/lib/categories";
import { todayISO } from "@/lib/dates";
import { useCategories } from "@/lib/hooks";
import { Button, Field, IconButton, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ReceiptFormItem {
  description: string;
  amount: string;
}

export interface ReceiptFormValues {
  purchaseDate: string;
  merchant: string;
  total: string;
  categoryId: string;
  merchantNif: string;
  notes: string;
  items: ReceiptFormItem[];
}

export interface ReceiptFormResult {
  purchaseDate: string;
  merchant: string;
  totalCents: number;
  categoryId: string;
  merchantNif: string | null;
  notes: string | null;
  items: { description: string; totalCents: number }[];
}

interface ReceiptFormProps {
  initial: Partial<ReceiptFormValues>;
  submitLabel: string;
  busy?: boolean;
  warningFields?: { merchant?: boolean; date?: boolean; total?: boolean };
  warnings?: string[];
  merchantSuggestions?: string[];
  onSubmit: (result: ReceiptFormResult) => Promise<void> | void;
  onCancel?: () => void;
  cancelLabel?: string;
  topSlot?: ReactNode;
}

export function ReceiptForm({
  initial,
  submitLabel,
  busy = false,
  warningFields,
  warnings = [],
  merchantSuggestions = [],
  onSubmit,
  onCancel,
  cancelLabel = "Cancelar",
  topSlot,
}: ReceiptFormProps) {
  const categories = useCategories();
  const [values, setValues] = useState<ReceiptFormValues>(() => ({
    purchaseDate: initial.purchaseDate ?? todayISO(),
    merchant: initial.merchant ?? "",
    total: initial.total ?? "",
    categoryId: initial.categoryId ?? "otros",
    merchantNif: initial.merchantNif ?? "",
    notes: initial.notes ?? "",
    items: initial.items ?? [],
  }));
  const [categoryTouched, setCategoryTouched] = useState(Boolean(initial.categoryId));
  const [errors, setErrors] = useState<{ merchant?: string; total?: string; date?: string }>({});
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalCents = parseAmountToCents(values.total);
  const itemsTotalCents = useMemo(
    () =>
      values.items.reduce((sum, item) => {
        const cents = parseAmountToCents(item.amount);
        return sum + (cents && cents > 0 ? cents : 0);
      }, 0),
    [values.items],
  );

  function update<K extends keyof ReceiptFormValues>(key: K, value: ReceiptFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleMerchantChange(value: string) {
    setValues((current) => {
      const next = { ...current, merchant: value };
      if (!categoryTouched && value.trim().length >= 3) {
        next.categoryId = guessCategory(value);
      }
      return next;
    });
    if (errors.merchant) setErrors((current) => ({ ...current, merchant: undefined }));
  }

  function updateItem(index: number, patch: Partial<ReceiptFormItem>) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addItem() {
    setValues((current) => ({
      ...current,
      items: [...current.items, { description: "", amount: "" }],
    }));
  }

  function removeItem(index: number) {
    setValues((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function normalizeTotal() {
    const cents = parseAmountToCents(values.total);
    if (cents !== null && cents > 0) {
      update("total", centsToInput(cents));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: { merchant?: string; total?: string; date?: string } = {};
    if (!values.merchant.trim()) nextErrors.merchant = "Indica el comercio.";
    if (totalCents === null || totalCents <= 0) nextErrors.total = "Introduce un importe válido.";
    if (!values.purchaseDate) nextErrors.date = "Indica la fecha del ticket.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const items = values.items
      .map((item) => ({
        description: item.description.trim(),
        totalCents: parseAmountToCents(item.amount) ?? 0,
      }))
      .filter((item) => item.description.length > 0 && item.totalCents > 0);

    setPending(true);
    try {
      await onSubmit({
        purchaseDate: values.purchaseDate,
        merchant: values.merchant.trim(),
        totalCents: totalCents as number,
        categoryId: values.categoryId,
        merchantNif: values.merchantNif.trim() || null,
        notes: values.notes.trim() || null,
        items,
      });
    } catch (error) {
      console.error(error);
      setSubmitError("No se ha podido guardar el ticket. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  const disabled = busy || pending;
  const itemExtra =
    totalCents !== null && totalCents > 0 && itemsTotalCents > 0
      ? itemsTotalCents - totalCents
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {topSlot}

      {warnings.length > 0 ? (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <ul className="space-y-1 leading-snug">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-3xl border border-line bg-surface p-4",
          (warningFields?.total || errors.total) && "border-amber-400 ring-2 ring-amber-300/40",
        )}
      >
        <label htmlFor="total" className="text-sm font-medium text-ink-soft">
          Total del ticket
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
            Comprueba este importe: es el que suma en el total del mes.
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
            onChange={(event) => handleMerchantChange(event.target.value)}
            className={cn(
              (warningFields?.merchant || errors.merchant) &&
                "border-amber-400 ring-2 ring-amber-300/40",
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

        <Field label="Fecha de compra" htmlFor="purchaseDate">
          <Input
            id="purchaseDate"
            type="date"
            max={todayISO()}
            value={values.purchaseDate}
            onChange={(event) => update("purchaseDate", event.target.value)}
            className={cn(
              (warningFields?.date || errors.date) &&
                "border-amber-400 ring-2 ring-amber-300/40",
            )}
          />
          {errors.date ? (
            <p className="text-xs font-medium text-red-600">{errors.date}</p>
          ) : null}
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink-soft">Categoría</p>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => {
            const selected = values.categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setCategoryTouched(true);
                  update("categoryId", category.id);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition-all active:scale-[0.98]",
                  selected
                    ? "border-transparent text-white shadow-sm"
                    : "border-line bg-surface text-ink-soft hover:border-muted/40",
                )}
                style={selected ? { backgroundColor: category.color } : undefined}
              >
                <span aria-hidden className="text-base">
                  {category.emoji}
                </span>
                <span className="truncate">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <details className="group rounded-2xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink-soft">
          <span>
            Artículos detectados
            {values.items.length > 0 ? (
              <span className="ml-2 rounded-full bg-paper-deep px-2 py-0.5 text-xs font-semibold text-muted">
                {values.items.length}
              </span>
            ) : null}
          </span>
          <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-3 border-t border-line px-4 py-4">
          {values.items.length === 0 ? (
            <p className="text-sm text-muted">
              Sin artículos. Puedes añadirlos a mano si quieres ver el desglose.
            </p>
          ) : (
            <div className="space-y-2">
              {values.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_6.5rem_2rem] items-center gap-2"
                >
                  <Input
                    placeholder="Producto"
                    value={item.description}
                    onChange={(event) => updateItem(index, { description: event.target.value })}
                    className="h-10 rounded-xl px-3 text-sm"
                  />
                  <Input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={item.amount}
                    onChange={(event) => updateItem(index, { amount: event.target.value })}
                    className="tabular h-10 rounded-xl px-3 text-right text-sm"
                  />
                  <IconButton
                    aria-label="Quitar artículo"
                    onClick={() => removeItem(index)}
                    className="size-8 text-muted hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ))}
            </div>
          )}

          {itemExtra !== null ? (
            <p
              className={cn(
                "text-xs",
                Math.abs(itemExtra) <= 2 ? "text-emerald-700" : "text-amber-700",
              )}
            >
              Los artículos suman {formatEUR(itemsTotalCents)}
              {Math.abs(itemExtra) > 2
                ? ` · diferencia de ${formatEUR(Math.abs(itemExtra))} con el total`
                : " · cuadra con el total"}
            </p>
          ) : null}

          <Button variant="outline" size="sm" onClick={addItem} className="w-full">
            <Plus className="size-4" />
            Añadir artículo
          </Button>
        </div>
      </details>

      <details className="group rounded-2xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink-soft">
          Más detalles
          <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-line px-4 py-4">
          <Field label="NIF / CIF del comercio" htmlFor="nif" hint="Opcional">
            <Input
              id="nif"
              placeholder="B12345678"
              value={values.merchantNif}
              onChange={(event) => update("merchantNif", event.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Nota" htmlFor="notes" hint="Opcional">
            <Textarea
              id="notes"
              placeholder="Compra semanal, cena con amigos…"
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          </Field>
        </div>
      </details>

      {submitError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 pt-1">
        <Button type="submit" size="lg" fullWidth disabled={disabled}>
          {disabled ? <Loader2 className="size-5 animate-spin" /> : null}
          {pending ? "Guardando…" : submitLabel}
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
