import JSZip from "jszip";
import { todayISO } from "./dates";
import { createReceipt, db, type Receipt } from "./db";

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

export function receiptsToCsv(receipts: Receipt[]) {
  const header = ["Fecha", "Comercio", "Importe (€)"];

  const rows = receipts.map((receipt) => [
    receipt.purchaseDate.split("-").reverse().join("/"),
    receipt.merchant,
    (receipt.totalCents / 100).toFixed(2).replace(".", ","),
  ]);

  const content = [header, ...rows]
    .map((row) => row.map((value) => csvCell(String(value))).join(";"))
    .join("\r\n");

  return `\ufeff${content}`;
}

export function exportCsv(receipts: Receipt[]) {
  const csv = receiptsToCsv(receipts);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `tiquet-gastos-${todayISO()}.csv`);
}

interface BackupReceipt {
  id: number;
  createdAt: string;
  purchaseDate: string;
  merchant: string;
  totalCents: number;
  imageFile: string | null;
  thumbFile: string | null;
}

interface BackupPayload {
  app: "tiquet";
  version: number;
  exportedAt: string;
  receipts: BackupReceipt[];
}

export async function buildBackup() {
  const receipts = await db.receipts.orderBy("purchaseDate").toArray();

  const zip = new JSZip();
  const images = zip.folder("images");
  const thumbs = zip.folder("thumbs");

  const backupReceipts: BackupReceipt[] = receipts.map((receipt) => {
    if (receipt.image) images?.file(`${receipt.id}.jpg`, receipt.image);
    if (receipt.thumb) thumbs?.file(`${receipt.id}.jpg`, receipt.thumb);

    return {
      id: receipt.id,
      createdAt: receipt.createdAt,
      purchaseDate: receipt.purchaseDate,
      merchant: receipt.merchant,
      totalCents: receipt.totalCents,
      imageFile: receipt.image ? `images/${receipt.id}.jpg` : null,
      thumbFile: receipt.thumb ? `thumbs/${receipt.id}.jpg` : null,
    };
  });

  const payload: BackupPayload = {
    app: "tiquet",
    version: 2,
    exportedAt: new Date().toISOString(),
    receipts: backupReceipts,
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

  let receiptCount = 0;

  for (const receipt of payload.receipts) {
    const merchant = typeof receipt.merchant === "string" ? receipt.merchant.trim() : "";
    const totalCents = Number(receipt.totalCents);
    const purchaseDate =
      typeof receipt.purchaseDate === "string" && receipt.purchaseDate
        ? receipt.purchaseDate
        : todayISO();

    if (!merchant || !Number.isFinite(totalCents)) continue;

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

    await createReceipt({
      createdAt:
        typeof receipt.createdAt === "string" ? receipt.createdAt : new Date().toISOString(),
      purchaseDate,
      merchant,
      totalCents,
      image,
      thumb,
    });
    receiptCount += 1;
  }

  return { receipts: receiptCount };
}
