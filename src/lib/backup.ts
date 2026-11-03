import JSZip from "jszip";
import type { Category } from "./categories";
import { todayISO } from "./dates";
import { createReceipt, db, ensureSeedData, type Receipt, type ReceiptItem } from "./db";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function receiptsToCsv(receipts: Receipt[], categories: Category[]) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  const header = [
    "Fecha",
    "Comercio",
    "Categoría",
    "Importe (€)",
    "NIF",
    "Nota",
    "Origen",
  ];

  const rows = receipts.map((receipt) => [
    receipt.purchaseDate.split("-").reverse().join("/"),
    receipt.merchant,
    categoryNames.get(receipt.categoryId) ?? receipt.categoryId,
    (receipt.totalCents / 100).toFixed(2).replace(".", ","),
    receipt.merchantNif ?? "",
    receipt.notes ?? "",
    receipt.source === "ocr" ? "OCR" : "Manual",
  ]);

  const content = [header, ...rows]
    .map((row) => row.map((value) => csvCell(String(value))).join(";"))
    .join("\r\n");

  return `\ufeff${content}`;
}

export function exportCsv(receipts: Receipt[], categories: Category[]) {
  const csv = receiptsToCsv(receipts, categories);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `tiquet-gastos-${todayISO()}.csv`);
}

interface BackupReceipt extends Omit<Receipt, "image" | "thumb"> {
  imageFile: string | null;
  thumbFile: string | null;
}

interface BackupPayload {
  app: "tiquet";
  version: number;
  exportedAt: string;
  categories: Category[];
  receipts: BackupReceipt[];
  items: ReceiptItem[];
}

export async function buildBackup() {
  const receipts = await db.receipts.orderBy("purchaseDate").toArray();
  const items = await db.items.toArray();
  const categories = await db.categories.orderBy("sort").toArray();

  const zip = new JSZip();
  const images = zip.folder("images");
  const thumbs = zip.folder("thumbs");

  const backupReceipts: BackupReceipt[] = receipts.map((receipt) => {
    const { image, thumb, ...rest } = receipt;
    if (image) images?.file(`${receipt.id}.jpg`, image);
    if (thumb) thumbs?.file(`${receipt.id}.jpg`, thumb);

    return {
      ...rest,
      imageFile: image ? `images/${receipt.id}.jpg` : null,
      thumbFile: thumb ? `thumbs/${receipt.id}.jpg` : null,
    };
  });

  const payload: BackupPayload = {
    app: "tiquet",
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    receipts: backupReceipts,
    items,
  };

  zip.file("backup.json", JSON.stringify(payload, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, count: receipts.length };
}

export async function importBackup(file: File) {
  let payload: BackupPayload;
  let zip: JSZip | null = null;

  if (file.name.toLowerCase().endsWith(".zip")) {
    zip = await JSZip.loadAsync(file);
    const jsonFile = zip.file("backup.json");
    if (!jsonFile) throw new Error("El ZIP no contiene backup.json.");
    payload = JSON.parse(await jsonFile.async("string")) as BackupPayload;
  } else {
    payload = JSON.parse(await file.text()) as BackupPayload;
  }

  if (payload.app !== "tiquet" || !Array.isArray(payload.receipts)) {
    throw new Error("El archivo no es una copia de seguridad de Tiquet.");
  }

  await ensureSeedData();

  const existingCategories = new Set(
    (await db.categories.toArray()).map((category) => category.id),
  );

  for (const category of payload.categories ?? []) {
    if (!existingCategories.has(category.id)) {
      await db.categories.put(category);
    }
  }

  const idMap = new Map<number, number>();
  let receiptCount = 0;
  let itemCount = 0;

  for (const receipt of payload.receipts) {
    let image: Blob | null = null;
    let thumb: Blob | null = null;

    if (zip) {
      if (receipt.imageFile) {
        const entry = zip.file(receipt.imageFile);
        if (entry) image = await entry.async("blob");
      }
      if (receipt.thumbFile) {
        const entry = zip.file(receipt.thumbFile);
        if (entry) thumb = await entry.async("blob");
      }
    }

    const newId = await createReceipt(
      {
        createdAt: receipt.createdAt,
        purchaseDate: receipt.purchaseDate,
        merchant: receipt.merchant,
        merchantNif: receipt.merchantNif,
        totalCents: receipt.totalCents,
        categoryId: receipt.categoryId,
        notes: receipt.notes,
        rawText: receipt.rawText,
        ocrConfidence: receipt.ocrConfidence,
        source: receipt.source === "ocr" ? "ocr" : "manual",
        vat: receipt.vat ?? [],
        image,
        thumb,
      },
      [],
    );

    idMap.set(receipt.id, newId);
    receiptCount += 1;
  }

  for (const item of payload.items ?? []) {
    const newReceiptId = idMap.get(item.receiptId);
    if (!newReceiptId) continue;

    await db.items.add({
      receiptId: newReceiptId,
      description: item.description,
      totalCents: item.totalCents,
      qty: item.qty ?? null,
    });
    itemCount += 1;
  }

  return { receipts: receiptCount, items: itemCount };
}
