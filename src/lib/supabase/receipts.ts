import { getSupabaseBrowserClient } from "./client";

export const RECEIPTS_BUCKET = "receipts";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;
const SIGNED_URL_BATCH_SIZE = 100;

export interface Receipt {
  id: string;
  createdAt: string;
  purchaseDate: string;
  merchant: string;
  totalCents: number;
  imagePath: string | null;
  thumbPath: string | null;
}

export interface ReceiptWithUrls extends Receipt {
  imageUrl: string | null;
  thumbUrl: string | null;
}

export interface ReceiptInput {
  purchaseDate: string;
  merchant: string;
  totalCents: number;
}

export interface ReceiptPhotoInput {
  image: Blob | null;
  thumb: Blob | null;
}

interface ReceiptRow {
  id: string;
  user_id: string;
  created_at: string;
  purchase_date: string;
  merchant: string;
  total_cents: number;
  image_path: string | null;
  thumb_path: string | null;
}

function mapRow(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    createdAt: row.created_at,
    purchaseDate: row.purchase_date,
    merchant: row.merchant,
    totalCents: row.total_cents,
    imagePath: row.image_path,
    thumbPath: row.thumb_path,
  };
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function withSignedUrls(receipts: Receipt[]): Promise<ReceiptWithUrls[]> {
  const paths = [
    ...new Set(
      receipts
        .flatMap((receipt) => [receipt.imagePath, receipt.thumbPath])
        .filter((path): path is string => Boolean(path)),
    ),
  ];

  if (paths.length === 0) {
    return receipts.map((receipt) => ({
      ...receipt,
      imageUrl: null,
      thumbUrl: null,
    }));
  }

  const supabase = getSupabaseBrowserClient();
  const signed = new Map<string, string>();

  for (const batch of chunk(paths, SIGNED_URL_BATCH_SIZE)) {
    const { data, error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrls(batch, SIGNED_URL_TTL_SECONDS);

    if (error) throw error;

    for (const item of data ?? []) {
      if (item.path && item.signedUrl) {
        signed.set(item.path, item.signedUrl);
      }
    }
  }

  return receipts.map((receipt) => ({
    ...receipt,
    imageUrl: receipt.imagePath ? signed.get(receipt.imagePath) ?? null : null,
    thumbUrl: receipt.thumbPath ? signed.get(receipt.thumbPath) ?? null : null,
  }));
}

export async function fetchReceipts(): Promise<ReceiptWithUrls[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return withSignedUrls((data ?? []).map((row) => mapRow(row as ReceiptRow)));
}

function photoPath(userId: string, receiptId: string, kind: "image" | "thumb") {
  return `${userId}/${receiptId}-${kind}.jpg`;
}

async function uploadPhoto(
  userId: string,
  receiptId: string,
  kind: "image" | "thumb",
  blob: Blob,
) {
  const supabase = getSupabaseBrowserClient();
  const path = photoPath(userId, receiptId, kind);
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: true,
  });

  if (error) throw error;
  return path;
}

async function removePhotos(paths: (string | null)[]) {
  const valid = paths.filter((path): path is string => Boolean(path));
  if (valid.length === 0) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).remove(valid);
  if (error) console.warn("No se pudieron borrar algunas fotos:", error.message);
}

export async function createReceipt(
  userId: string,
  input: ReceiptInput,
  photo: ReceiptPhotoInput,
  options?: { createdAt?: string },
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const receiptId = crypto.randomUUID();

  let imagePath: string | null = null;
  let thumbPath: string | null = null;

  try {
    if (photo.image) {
      imagePath = await uploadPhoto(userId, receiptId, "image", photo.image);
    }
    if (photo.thumb) {
      thumbPath = await uploadPhoto(userId, receiptId, "thumb", photo.thumb);
    }

    const { error } = await supabase.from("receipts").insert({
      id: receiptId,
      user_id: userId,
      created_at: options?.createdAt ?? new Date().toISOString(),
      purchase_date: input.purchaseDate,
      merchant: input.merchant,
      total_cents: input.totalCents,
      image_path: imagePath,
      thumb_path: thumbPath,
    });

    if (error) throw error;
    return receiptId;
  } catch (error) {
    await removePhotos([imagePath, thumbPath]);
    throw error;
  }
}

export async function updateReceipt(
  userId: string,
  receipt: Receipt,
  input: ReceiptInput,
  photo: ReceiptPhotoInput,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  let imagePath = receipt.imagePath;
  let thumbPath = receipt.thumbPath;

  if (photo.image) {
    imagePath = await uploadPhoto(userId, receipt.id, "image", photo.image);
    thumbPath = photo.thumb
      ? await uploadPhoto(userId, receipt.id, "thumb", photo.thumb)
      : null;
  }

  const { error } = await supabase
    .from("receipts")
    .update({
      purchase_date: input.purchaseDate,
      merchant: input.merchant,
      total_cents: input.totalCents,
      image_path: imagePath,
      thumb_path: thumbPath,
    })
    .eq("id", receipt.id);

  if (error) throw error;

  if (photo.image && receipt.thumbPath && receipt.thumbPath !== thumbPath) {
    await removePhotos([receipt.thumbPath]);
  }
}

export async function deleteReceipt(receipt: Receipt): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("receipts").delete().eq("id", receipt.id);
  if (error) throw error;

  await removePhotos([receipt.imagePath, receipt.thumbPath]);
}

export async function clearAllReceipts(userId: string, receipts: Receipt[]) {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.from("receipts").delete().eq("user_id", userId);
  if (error) throw error;

  const paths = receipts
    .flatMap((receipt) => [receipt.imagePath, receipt.thumbPath])
    .filter((path): path is string => Boolean(path));

  for (const batch of chunk(paths, SIGNED_URL_BATCH_SIZE)) {
    const { error: storageError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .remove(batch);
    if (storageError) {
      console.warn("No se pudieron borrar algunas fotos:", storageError.message);
    }
  }
}

export async function downloadReceiptFile(path: string): Promise<Blob | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).download(path);
  if (error) {
    console.warn("No se pudo descargar", path, error.message);
    return null;
  }
  return data;
}
