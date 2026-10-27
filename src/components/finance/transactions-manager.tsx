"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Panel } from "@/components/finance/section";
import { TransactionFormSheet } from "@/components/finance/transaction-form-sheet";
import { TransactionList } from "@/components/finance/transaction-list";
import { Button } from "@/components/ui/button";
import type { Account, Category, Transaction } from "@/lib/schemas";

interface TransactionsManagerProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  uid: string;
}

export function TransactionsManager({ transactions, categories, accounts, uid }: TransactionsManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = transactions.find((t) => t.id === editingId) ?? null;

  function openSheet(transaction: Transaction | null) {
    setEditingId(transaction?.id ?? null);
    setOpen(true);
  }

  return (
    <>
      <Button className="fixed right-4 bottom-24 z-30 size-14 rounded-full shadow-soft md:static md:size-auto md:self-end md:rounded-xl" onClick={() => openSheet(null)}>
        <PlusIcon className="size-5" />
        <span className="max-md:sr-only">Novo lançamento</span>
      </Button>
      <Panel>
        {transactions.length ? (
          <TransactionList transactions={transactions} categories={categories} accounts={accounts} onSelect={openSheet} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum lançamento neste mês.</p>
        )}
      </Panel>
      <TransactionFormSheet
        open={open}
        onOpenChange={setOpen}
        transaction={editing}
        categories={categories}
        accounts={accounts}
        uid={uid}
      />
    </>
  );
}
