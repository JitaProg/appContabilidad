"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ReceiptForm, type ReceiptFormResult } from "@/components/receipt-form";
import { Button, Dialog } from "@/components/ui";
import { useToast } from "@/components/providers";
import { useRecentMerchants } from "@/lib/hooks";
import { createReceipt, findPossibleDuplicate } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { formatFullDate, todayISO } from "@/lib/dates";

interface PendingSave {
  result: ReceiptFormResult;
  duplicate: { merchant: string; purchaseDate: string; totalCents: number };
}

export default function NewReceiptPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const merchants = useRecentMerchants();

  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);

  async function saveReceipt(result: ReceiptFormResult) {
    const id = await createReceipt({
      purchaseDate: result.purchaseDate,
      merchant: result.merchant,
      totalCents: result.totalCents,
      image: result.image,
      thumb: result.thumb,
    });

    showToast("Ticket guardado correctamente.");
    router.push(`/receipts/${id}`);
  }

  async function handleSubmit(result: ReceiptFormResult) {
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

    await saveReceipt(result);
  }

  async function handleConfirmDuplicate() {
    if (!pendingSave) return;
    const pending = pendingSave;
    setPendingSave(null);

    try {
      await saveReceipt(pending.result);
    } catch (error) {
      console.error(error);
      showToast("No se ha podido guardar el ticket.", "error");
    }
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Nuevo ticket"
        subtitle="Foto, importe, comercio y fecha"
        backHref="/receipts"
      />

      <div className="px-5 pt-5">
        <ReceiptForm
          initial={{ purchaseDate: todayISO() }}
          submitLabel="Guardar ticket"
          merchantSuggestions={merchants ?? []}
          onSubmit={handleSubmit}
        />
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
            <Button fullWidth onClick={handleConfirmDuplicate}>
              Guardar igual
            </Button>
          </>
        }
      />
    </div>
  );
}
