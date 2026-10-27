"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isMockMode } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { receiptMetaSchema, receiptTargetSchema } from "@/lib/schemas";

export type ReceiptActionResult = { ok: true; storagePath?: string } | { ok: false; error: string };

export async function attachReceipt(target: unknown, meta: unknown): Promise<ReceiptActionResult> {
  const user = await requireUser();
  const parsedTarget = receiptTargetSchema.safeParse(target);
  const parsedMeta = receiptMetaSchema.safeParse(meta);
  if (!parsedTarget.success || !parsedMeta.success) return { ok: false, error: "Dados inválidos" };

  const prefix = isMockMode ? "mock/" : `users/${user.uid}/receipts/`;
  if (!parsedMeta.data.storagePath.startsWith(prefix)) return { ok: false, error: "Caminho inválido" };

  try {
    await getRepository(user.uid).addReceipt(parsedTarget.data, parsedMeta.data);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao anexar" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function detachReceipt(target: unknown, receiptId: string): Promise<ReceiptActionResult> {
  const user = await requireUser();
  const parsedTarget = receiptTargetSchema.safeParse(target);
  if (!parsedTarget.success) return { ok: false, error: "Dados inválidos" };

  try {
    const receipt = await getRepository(user.uid).removeReceipt(parsedTarget.data, receiptId);
    revalidatePath("/", "layout");
    return { ok: true, storagePath: receipt.storagePath };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao remover" };
  }
}
