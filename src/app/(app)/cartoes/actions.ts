"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/repository";
import { accountInputSchema, idSchema } from "@/lib/schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveAccount(id: string | null, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = accountInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const repo = getRepository(user.uid);
  try {
    if (id) await repo.updateAccount(idSchema.parse(id), parsed.data);
    else await repo.createAccount(parsed.data);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function archiveAccount(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await getRepository(user.uid).archiveAccount(idSchema.parse(id));
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao arquivar" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
