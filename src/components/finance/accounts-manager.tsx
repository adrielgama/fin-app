"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { AccountFormSheet } from "@/components/finance/account-form-sheet";
import { Button } from "@/components/ui/button";
import type { Account } from "@/lib/schemas";

const typeLabels: Record<Account["type"], string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  credit_card: "Cartão",
  cash: "Dinheiro",
  investment: "Investimentos",
};

export function AccountsManager({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = accounts.find((a) => a.id === editingId) ?? null;

  function openSheet(account: Account | null) {
    setEditingId(account?.id ?? null);
    setOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {accounts.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => openSheet(a)}
            className="group flex items-center gap-2 rounded-full bg-card py-1.5 pr-3 pl-2 text-sm shadow-soft ring-1 ring-foreground/5 transition-transform hover:-translate-y-0.5"
          >
            <span className="size-3 rounded-full" style={{ backgroundColor: a.color }} />
            <span className="font-medium">{a.name}</span>
            <span className="text-xs text-muted-foreground">{typeLabels[a.type]}</span>
            <PencilIcon className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => openSheet(null)}>
          <PlusIcon className="size-4" /> Nova conta ou cartão
        </Button>
      </div>
      <AccountFormSheet open={open} onOpenChange={setOpen} account={editing} />
    </>
  );
}
