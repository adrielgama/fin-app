import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isMockMode } from "@/lib/env";
import { getMockReceiptFiles } from "@/lib/repository/mock";
import { RECEIPT_CONTENT_TYPES, RECEIPT_MAX_BYTES, receiptMetaSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  if (!isMockMode) return NextResponse.json({ error: "Upload via Firebase Storage" }, { status: 403 });
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

  const id = crypto.randomUUID();
  const parsed = receiptMetaSchema.safeParse({
    id,
    storagePath: `mock/${id}`,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });
  if (!parsed.success) {
    const reason = !RECEIPT_CONTENT_TYPES.some((t) => t === file.type)
      ? "Formato não suportado (PDF, JPG, PNG ou WebP)"
      : file.size > RECEIPT_MAX_BYTES
        ? "Arquivo maior que 10 MB"
        : "Arquivo inválido";
    return NextResponse.json({ error: reason }, { status: 400 });
  }

  getMockReceiptFiles().set(id, { contentType: file.type, bytes: new Uint8Array(await file.arrayBuffer()) });
  return NextResponse.json(parsed.data);
}
