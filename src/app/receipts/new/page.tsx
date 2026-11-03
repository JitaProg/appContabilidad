"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ReceiptForm, type ReceiptFormResult } from "@/components/receipt-form";
import { useToast } from "@/components/providers";
import { useRecentMerchants } from "@/lib/hooks";
import { createReceipt } from "@/lib/db";
import { todayISO } from "@/lib/dates";

export default function NewReceiptPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const merchants = useRecentMerchants();

  async function handleSubmit(result: ReceiptFormResult) {
    const id = await createReceipt(
      {
        purchaseDate: result.purchaseDate,
        merchant: result.merchant,
        totalCents: result.totalCents,
        categoryId: result.categoryId,
        merchantNif: result.merchantNif,
        notes: result.notes,
        source: "manual",
        vat: [],
        image: null,
        thumb: null,
      },
      result.items,
    );

    showToast("Ticket guardado correctamente.");
    router.push(`/receipts/${id}`);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Nuevo ticket"
        subtitle="Añade los datos a mano"
        backHref="/receipts"
      />

      <div className="px-5 pt-5">
        <ReceiptForm
          initial={{
            purchaseDate: todayISO(),
            items: [],
          }}
          submitLabel="Guardar ticket"
          merchantSuggestions={merchants ?? []}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
