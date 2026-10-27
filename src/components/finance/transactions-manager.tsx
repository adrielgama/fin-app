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
}

export function TransactionsManager({ transactions, categories, accounts }: TransactionsManagerProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  function openSheet(transaction: Transaction | null) {
    setEditing(transaction);
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
      />
    </>
  );
}
