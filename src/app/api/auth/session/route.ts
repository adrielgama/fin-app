import { NextResponse } from "next/server";
import { z } from "zod";
import { MOCK_SESSION_VALUE, SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/auth/constants";
import { isMockMode } from "@/lib/env";
import { adminAuth } from "@/lib/firebase/admin";

const bodySchema = z.union([z.object({ idToken: z.string().min(1) }), z.object({ mock: z.literal(true) })]);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

  const response = NextResponse.json({ ok: true });
  const maxAge = SESSION_MAX_AGE_MS / 1000;

  if ("mock" in parsed.data) {
    if (!isMockMode) return NextResponse.json({ error: "Modo mock desativado" }, { status: 403 });
    response.cookies.set(SESSION_COOKIE, MOCK_SESSION_VALUE, { ...cookieOptions, maxAge });
    return response;
  }

  try {
    const auth = adminAuth();
    const decoded = await auth.verifyIdToken(parsed.data.idToken);
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Login recente necessário" }, { status: 401 });
    }
    const session = await auth.createSessionCookie(parsed.data.idToken, { expiresIn: SESSION_MAX_AGE_MS });
    response.cookies.set(SESSION_COOKIE, session, { ...cookieOptions, maxAge });
    return response;
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
