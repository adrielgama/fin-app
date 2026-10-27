import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { isMockMode } from "@/lib/env";
import { getFirebaseClient } from "@/lib/firebase/client";
import { RECEIPT_CONTENT_TYPES, RECEIPT_MAX_BYTES, type Receipt, type ReceiptMeta } from "@/lib/schemas";

export function validateReceiptFile(file: File): string | null {
  if (!RECEIPT_CONTENT_TYPES.some((t) => t === file.type)) return "Formato não suportado (PDF, JPG, PNG ou WebP)";
  if (file.size > RECEIPT_MAX_BYTES) return "Arquivo maior que 10 MB";
  return null;
}

export async function uploadReceiptFile(file: File, uid: string): Promise<ReceiptMeta> {
  if (isMockMode) {
    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/receipts", { method: "POST", body });
    const data: unknown = await res.json();
    if (!res.ok) throw new Error((data as { error?: string }).error ?? "Falha no upload");
    return data as ReceiptMeta;
  }

  const id = crypto.randomUUID();
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
  const storagePath = `users/${uid}/receipts/${id}-${safeName}`;
  await uploadBytes(ref(getFirebaseClient().storage, storagePath), file, { contentType: file.type });
  return {
    id,
    storagePath,
    fileName: file.name,
    contentType: file.type as ReceiptMeta["contentType"],
    size: file.size,
  };
}

export const getReceiptUrl = (receipt: Receipt): Promise<string> =>
  isMockMode ? Promise.resolve(`/api/receipts/${receipt.id}`) : getDownloadURL(ref(getFirebaseClient().storage, receipt.storagePath));

export async function deleteReceiptFile(storagePath: string): Promise<void> {
  if (!isMockMode) await deleteObject(ref(getFirebaseClient().storage, storagePath));
}
