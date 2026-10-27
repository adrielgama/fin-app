"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/repository";
import { billInputSchema, idSchema, isoDateSchema } from "@/lib/schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function run(task: () => Promise<unknown>, fallback: string): Promise<ActionResult> {
  try {
    await task();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : fallback };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveBill(id: string | null, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = billInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const repo = getRepository(user.uid);
  return run(() => (id ? repo.updateBill(idSchema.parse(id), parsed.data) : repo.createBill(parsed.data)), "Erro ao salvar");
}

export async function removeBill(id: string): Promise<ActionResult> {
  const user = await requireUser();
  return run(() => getRepository(user.uid).deleteBill(idSchema.parse(id)), "Erro ao excluir");
}

export async function payBill(id: string, paidAt: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({ id: idSchema, paidAt: isoDateSchema }).safeParse({ id, paidAt });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };
  return run(() => getRepository(user.uid).payBill(parsed.data.id, parsed.data.paidAt), "Erro ao pagar");
}
