"use client";

import { useRef, useTransition } from "react";
import { FileTextIcon, ImageIcon, PaperclipIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { attachReceipt, detachReceipt } from "@/app/(app)/receipts/actions";
import { Button } from "@/components/ui/button";
import { deleteReceiptFile, getReceiptUrl, uploadReceiptFile, validateReceiptFile } from "@/lib/receipt-storage";
import type { Receipt, ReceiptTarget } from "@/lib/schemas";

interface ReceiptsFieldProps {
  target: ReceiptTarget;
  receipts: Receipt[];
  uid: string;
}

const formatSize = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`);

export function ReceiptsField({ target, receipts, uid }: ReceiptsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    const invalid = validateReceiptFile(file);
    if (invalid) return void toast.error(invalid);

    startTransition(async () => {
      try {
        const meta = await uploadReceiptFile(file, uid);
        const result = await attachReceipt(target, meta);
        if (!result.ok) throw new Error(result.error);
        toast.success("Comprovante anexado");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha no upload");
      }
    });
  }

  function onRemove(receipt: Receipt) {
    startTransition(async () => {
      const result = await detachReceipt(target, receipt.id);
      if (!result.ok) return void toast.error(result.error);
      await deleteReceiptFile(result.storagePath ?? receipt.storagePath).catch(() => undefined);
      toast.success("Comprovante removido");
    });
  }

  async function onOpen(receipt: Receipt) {
    try {
      window.open(await getReceiptUrl(receipt), "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Não foi possível abrir o arquivo");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Comprovantes</span>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => inputRef.current?.click()}>
          <PaperclipIcon className="size-4" />
          {pending ? "Enviando..." : "Anexar"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
          aria-label="Selecionar comprovante"
        />
      </div>
      {receipts.length === 0 ? (
        <p className="text-xs text-muted-foreground">PDF, JPG, PNG ou WebP, até 10 MB.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {receipts.map((r) => {
            const Icon = r.contentType === "application/pdf" ? FileTextIcon : ImageIcon;
            return (
              <li key={r.id} className="flex items-center gap-2 rounded-xl bg-muted/60 p-2 text-sm">
                <Icon className="size-4 shrink-0 text-primary" />
                <button type="button" onClick={() => onOpen(r)} className="min-w-0 flex-1 truncate text-left hover:underline">
                  {r.fileName}
                </button>
                <span className="text-xs text-muted-foreground">{formatSize(r.size)}</span>
                <Button type="button" variant="ghost" size="icon-sm" disabled={pending} onClick={() => onRemove(r)} aria-label={`Remover ${r.fileName}`}>
                  <Trash2Icon className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
