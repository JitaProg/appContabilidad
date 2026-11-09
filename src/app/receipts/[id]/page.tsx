"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, ReceiptText, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
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
import { useReceipt } from "@/lib/hooks";
import { deleteReceipt, updateReceipt } from "@/lib/db";
import { formatEUR, centsToInput } from "@/lib/money";
import { formatFullDate } from "@/lib/dates";

export default function ReceiptDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const receiptId = Number(params?.id);
  const receipt = useReceipt(receiptId);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewImage, setViewImage] = useState(false);

  async function handleUpdate(result: ReceiptFormResult) {
    if (!receipt) return;

    await updateReceipt(receipt.id, {
      purchaseDate: result.purchaseDate,
      merchant: result.merchant,
      totalCents: result.totalCents,
      image: result.image,
      thumb: result.thumb,
    });

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
            }}
            initialImage={receipt.image}
            initialThumb={receipt.thumb}
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
            <IconButton aria-label="Editar ticket" onClick={() => setEditing(true)}>
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
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
            Importe total
          </p>
          <p className="tabular mt-1 text-[2.1rem] font-semibold leading-none tracking-tight text-ink">
            {formatEUR(receipt.totalCents)}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted">Fecha</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {formatFullDate(receipt.purchaseDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Comercio</dt>
              <dd className="mt-0.5 truncate font-medium text-ink">
                {receipt.merchant}
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
        ) : (
          <Card className="flex items-center gap-3 p-4 text-sm text-muted">
            <ReceiptText className="size-5 shrink-0 text-brand" />
            Este ticket no tiene foto. Puedes añadirla desde Editar.
          </Card>
        )}
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="¿Eliminar este ticket?"
        description="Se borrarán la foto y los datos asociados. Esta acción no se puede deshacer."
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
