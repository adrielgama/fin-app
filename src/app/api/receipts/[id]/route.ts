import { getCurrentUser } from "@/lib/auth/session";
import { isMockMode } from "@/lib/env";
import { getMockReceiptFiles } from "@/lib/repository/mock";

export async function GET(_request: Request, { params }: RouteContext<"/api/receipts/[id]">) {
  if (!isMockMode || !(await getCurrentUser())) return new Response("Não encontrado", { status: 404 });

  const file = getMockReceiptFiles().get((await params).id);
  if (!file) return new Response("Não encontrado", { status: 404 });

  return new Response(file.bytes as BodyInit, {
    headers: { "Content-Type": file.contentType, "Content-Disposition": "inline", "X-Content-Type-Options": "nosniff" },
  });
}
