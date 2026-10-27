import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isMockMode } from "@/lib/env";
import { adminAuth } from "@/lib/firebase/admin";
import { MOCK_USER, MOCK_SESSION_VALUE, SESSION_COOKIE, type SessionUser } from "./constants";

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  if (isMockMode) return token === MOCK_SESSION_VALUE ? MOCK_USER : null;

  try {
    const decoded = await adminAuth().verifySessionCookie(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: decoded.name ?? decoded.email ?? "Usuário",
      photoURL: decoded.picture ?? null,
    };
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<SessionUser> {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
