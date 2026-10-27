"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/repository";

const prefsSchema = z.object({ push: z.boolean(), email: z.boolean() });

export async function saveNotificationPreferences(input: unknown): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  await getRepository(user.uid).setNotificationPreferences(parsed.data);
  revalidatePath("/ajustes");
  return { ok: true };
}

export async function registerFcmToken(token: unknown): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = z.string().min(20).max(4096).safeParse(token);
  if (!parsed.success) return { ok: false };
  await getRepository(user.uid).addFcmToken(parsed.data);
  revalidatePath("/ajustes");
  return { ok: true };
}
