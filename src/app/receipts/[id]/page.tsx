"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, ReceiptText, ScanLine, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CategoryBadge } from "@/components/category-badge";
import { BlobImage } from "@/components/blob-image";
import { ReceiptForm, type ReceiptFormResult } from "@/components/receipt-form";
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  IconButton,
  Skeleton,
} from "@/components/ui";
import { useToast } from "@/components/providers";
import { useCategoryMap, useReceipt, useReceiptItems } from "@/lib/hooks";
import { deleteReceipt, updateReceipt } from "@/lib/db";
import { formatEUR, centsToInput } from "@/lib/money";
import { formatFullDate } from "@/lib/dates";

export default function ReceiptDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const categoryMap = useCategoryMap();

  const receiptId = Number(params?.id);
  const receipt = useReceipt(receiptId);
  const items = useReceiptItems(receiptId);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewImage, setViewImage] = useState(false);

  const itemTotal = useMemo(
    () => (items ?? []).reduce((sum, item) => sum + item.totalCents, 0),
    [items],
  );

  async function handleUpdate(result: ReceiptFormResult) {
    if (!receipt) return;

    await updateReceipt(
      receipt.id,
      {
        purchaseDate: result.purchaseDate,
        merchant: result.merchant,
        totalCents: result.totalCents,
        categoryId: result.categoryId,
        merchantNif: result.merchantNif,
        notes: result.notes,
        rawText: receipt.rawText,
        ocrConfidence: receipt.ocrConfidence,
        source: receipt.source,
        vat: receipt.vat,
        image: receipt.image,
        thumb: receipt.thumb,
      },
      result.items,
    );

    setEditing(false);
    showToast("Cambios guardados.");
  }

  async function handleDelete() {
    if (!receipt) return;
    await deleteReceipt(receipt.id);
    setConfirmDelete(false);
    showToast("Ticket eliminado.", "info");
    router.push("/receipts");
  }

  if (receipt === undefined) {
    return (
      <div>
        <PageHeader title="Ticket" backHref="/receipts" />
        <div className="space-y-3 px-5 pt-5">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (receipt === null) {
    return (
      <div>
        <PageHeader title="Ticket no encontrado" backHref="/receipts" />
        <div className="px-5 pt-6">
          <EmptyState
            icon={<ReceiptText className="size-6" />}
            title="Este ticket ya no existe"
            description="Puede que se haya eliminado. Vuelve al listado para ver tus tickets."
            action={
              <Link href="/receipts" className="text-sm font-semibold text-brand">
                Ver todos los tickets
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const category = categoryMap.get(receipt.categoryId);

  if (editing) {
    return (
      <div className="animate-rise">
        <PageHeader
          title="Editar ticket"
          subtitle={receipt.merchant}
          backHref={`/receipts/${receipt.id}`}
        />

        <div className="px-5 pt-5">
          <ReceiptForm
            initial={{
              purchaseDate: receipt.purchaseDate,
              merchant: receipt.merchant,
              total: centsToInput(receipt.totalCents),
              categoryId: receipt.categoryId,
              merchantNif: receipt.merchantNif ?? "",
              notes: receipt.notes ?? "",
              items: (items ?? []).map((item) => ({
                description: item.description,
                amount: centsToInput(item.totalCents),
              })),
            }}
            submitLabel="Guardar cambios"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            cancelLabel="Cancelar edición"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title={receipt.merchant}
        subtitle={formatFullDate(receipt.purchaseDate)}
        backHref="/receipts"
        action={
          <div className="flex items-center gap-0.5">
            <IconButton
              aria-label="Editar ticket"
              onClick={() => setEditing(true)}
              disabled={items === undefined}
            >
              <Pencil className="size-4" />
            </IconButton>
            <IconButton
              aria-label="Eliminar ticket"
              onClick={() => setConfirmDelete(true)}
              className="hover:text-red-600"
            >
              <Trash2 className="size-4" />
            </IconButton>
          </div>
        }
      />

      <div className="space-y-4 px-5 pt-4">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Importe total
              </p>
              <p className="tabular mt-1 text-[2.1rem] font-semibold leading-none tracking-tight text-ink">
                {formatEUR(receipt.totalCents)}
              </p>
            </div>
            <CategoryBadge categoryId={receipt.categoryId} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted">Fecha</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {formatFullDate(receipt.purchaseDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Origen</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-ink">
                {receipt.source === "ocr" ? (
                  <>
                    <ScanLine className="size-4 text-brand" />
                    Escaneado
                    {receipt.ocrConfidence
                      ? ` · ${Math.round(receipt.ocrConfidence)} %`
                      : ""}
                  </>
                ) : (
                  "A mano"
                )}
              </dd>
            </div>
            {receipt.merchantNif ? (
              <div>
                <dt className="text-xs text-muted">NIF / CIF</dt>
                <dd className="mt-0.5 font-mono text-[0.8rem] font-medium text-ink">
                  {receipt.merchantNif}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-muted">Categoría</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {category ? `${category.emoji} ${category.name}` : "Otros"}
              </dd>
            </div>
          </dl>
        </Card>

        {receipt.image ? (
          <Card className="overflow-hidden">
            <BlobImage
              blob={receipt.image}
              alt={`Foto del ticket de ${receipt.merchant}`}
              className="max-h-80 w-full object-cover"
              onClick={() => setViewImage(true)}
            />
            <p className="px-4 py-2 text-center text-[0.7rem] text-muted">
              Toca la imagen para verla a tamaño completo
            </p>
          </Card>
        ) : null}

        {items && items.length > 0 ? (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">
                Artículos
                <span className="ml-2 rounded-full bg-paper-deep px-2 py-0.5 text-[0.7rem] font-semibold text-muted">
                  {items.length}
                </span>
              </h2>
              <span className="tabular text-sm font-semibold text-ink">
                {formatEUR(itemTotal)}
              </span>
            </div>

            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline justify-between gap-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 text-ink-soft">
                    {item.qty ? (
                      <span className="mr-1.5 rounded bg-paper-deep px-1.5 py-0.5 text-[0.68rem] font-semibold text-muted">
                        {item.qty}×
                      </span>
                    ) : null}
                    {item.description}
                  </span>
                  <span className="tabular shrink-0 font-medium text-ink">
                    {formatEUR(item.totalCents)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {receipt.vat.length > 0 ? (
          <Card className="p-5">
            <h2 className="mb-2 text-sm font-semibold text-ink">Desglose de IVA</h2>
            <ul className="space-y-1.5 text-sm">
              {receipt.vat.map((vat) => (
                <li
                  key={vat.rate}
                  className="flex items-baseline justify-between text-ink-soft"
                >
                  <span>IVA {vat.rate} %</span>
                  <span className="tabular font-medium text-ink">
                    {vat.amountCents !== null ? formatEUR(vat.amountCents) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {receipt.notes ? (
          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold text-ink">Nota</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {receipt.notes}
            </p>
          </Card>
        ) : null}

        {receipt.rawText ? (
          <details className="group rounded-3xl border border-line bg-surface p-5">
            <summary className="cursor-pointer list-none text-sm font-semibold text-ink-soft">
              Texto leído por el OCR
            </summary>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-paper p-3 font-mono text-[0.7rem] leading-relaxed text-ink-soft">
              {receipt.rawText}
            </pre>
          </details>
        ) : null}
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="¿Eliminar este ticket?"
        description="Se borrarán la foto y todos los datos asociados. Esta acción no se puede deshacer."
        footer={
          <>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setConfirmDelete(false)}
            >
              Cancelar
            </Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>
              Eliminar
            </Button>
          </>
        }
      />

      <Dialog
        open={viewImage}
        onClose={() => setViewImage(false)}
        title={receipt.merchant}
      >
        {receipt.image ? (
          <BlobImage
            blob={receipt.image}
            alt={`Ticket de ${receipt.merchant}`}
            className="max-h-[70vh] w-full rounded-2xl object-contain"
          />
        ) : null}
      </Dialog>
    </div>
  );
}
