"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import {
  clearAllReceipts,
  createReceipt,
  deleteReceipt,
  fetchReceipts,
  updateReceipt,
  type Receipt,
  type ReceiptInput,
  type ReceiptPhotoInput,
  type ReceiptWithUrls,
} from "@/lib/supabase/receipts";

interface ReceiptsContextValue {
  receipts: ReceiptWithUrls[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addReceipt: (input: ReceiptInput, photo: ReceiptPhotoInput) => Promise<string>;
  editReceipt: (
    receipt: Receipt,
    input: ReceiptInput,
    photo: ReceiptPhotoInput,
  ) => Promise<void>;
  removeReceipt: (receipt: Receipt) => Promise<void>;
  clearReceipts: () => Promise<void>;
  findDuplicate: (input: ReceiptInput) => ReceiptWithUrls | null;
}

const ReceiptsContext = createContext<ReceiptsContextValue | null>(null);

export function ReceiptsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptWithUrls[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setReceipts([]);
      setError(null);
      setReceiptsLoading(false);
      return;
    }

    setReceiptsLoading(true);
    setError(null);

    try {
      const data = await fetchReceipts();
      setReceipts(data);
    } catch (caught) {
      console.error(caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "No se han podido cargar los tickets.",
      );
    } finally {
      setReceiptsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    // Carga inicial desde Supabase; el estado de carga se activa al empezar
    // la petición, por eso la regla de setState en efectos no aplica aquí.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [authLoading, refresh]);

  const addReceipt = useCallback(
    async (input: ReceiptInput, photo: ReceiptPhotoInput) => {
      if (!user) throw new Error("Inicia sesión para guardar tickets.");
      const id = await createReceipt(user.id, input, photo);
      await refresh();
      return id;
    },
    [user, refresh],
  );

  const editReceipt = useCallback(
    async (receipt: Receipt, input: ReceiptInput, photo: ReceiptPhotoInput) => {
      if (!user) throw new Error("Inicia sesión para editar tickets.");
      await updateReceipt(user.id, receipt, input, photo);
      await refresh();
    },
    [user, refresh],
  );

  const removeReceipt = useCallback(
    async (receipt: Receipt) => {
      if (!user) throw new Error("Inicia sesión para borrar tickets.");
      await deleteReceipt(receipt);
      await refresh();
    },
    [user, refresh],
  );

  const clearReceipts = useCallback(async () => {
    if (!user) throw new Error("Inicia sesión para borrar tus tickets.");
    await clearAllReceipts(user.id, receipts);
    await refresh();
  }, [user, receipts, refresh]);

  const findDuplicate = useCallback(
    (input: ReceiptInput) => {
      const merchant = input.merchant.trim().toLowerCase();
      return (
        receipts.find(
          (receipt) =>
            receipt.purchaseDate === input.purchaseDate &&
            receipt.totalCents === input.totalCents &&
            receipt.merchant.trim().toLowerCase() === merchant,
        ) ?? null
      );
    },
    [receipts],
  );

  const value = useMemo<ReceiptsContextValue>(
    () => ({
      receipts,
      loading: authLoading || receiptsLoading,
      error,
      refresh,
      addReceipt,
      editReceipt,
      removeReceipt,
      clearReceipts,
      findDuplicate,
    }),
    [
      receipts,
      authLoading,
      receiptsLoading,
      error,
      refresh,
      addReceipt,
      editReceipt,
      removeReceipt,
      clearReceipts,
      findDuplicate,
    ],
  );

  return (
    <ReceiptsContext.Provider value={value}>{children}</ReceiptsContext.Provider>
  );
}

export function useReceipts() {
  const context = useContext(ReceiptsContext);
  if (!context) throw new Error("useReceipts debe usarse dentro de ReceiptsProvider");
  return context;
}

export function useRecentMerchants(limit = 20) {
  const { receipts } = useReceipts();
  return useMemo(() => {
    const names = [...receipts]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((receipt) => receipt.merchant.trim())
      .filter((name) => name.length > 0);
    return [...new Set(names)].slice(0, limit);
  }, [receipts, limit]);
}
