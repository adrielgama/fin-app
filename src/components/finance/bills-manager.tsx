"use client";

import { useState, useTransition } from "react";
import { CheckIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { payBill } from "@/app/(app)/contas/actions";
import { BillFormSheet } from "@/components/finance/bill-form-sheet";
import { Panel } from "@/components/finance/section";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { billState, dueLabel, type BillState } from "@/lib/bills";
import { formatCents, formatDate } from "@/lib/format";
import type { Account, Bill, Category } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface BillsManagerProps {
  bills: Bill[];
  categories: Category[];
  accounts: Account[];
  today: string;
  uid: string;
}

const tabs = [
  { value: "pending", label: "Pendentes" },
  { value: "paid", label: "Pagas" },
  { value: "all", label: "Todas" },
] as const;

const stateStyles: Record<BillState, string> = {
  overdue: "bg-destructive/12 text-destructive",
  today: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  soon: "bg-primary/12 text-primary",
  later: "bg-muted text-muted-foreground",
  paid: "bg-success/15 text-success",
};

export function BillsManager({ bills, categories, accounts, today, uid }: BillsManagerProps) {
  const [tab, setTab] = useState<(typeof tabs)[number]["value"]>("pending");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editing = bills.find((b) => b.id === editingId) ?? null;
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const visible = bills
    .filter((b) => tab === "all" || b.status === tab)
    .toSorted((a, b) => (tab === "paid" ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate)));

  function openSheet(bill: Bill | null) {
    setEditingId(bill?.id ?? null);
    setOpen(true);
  }

  function onPay(bill: Bill) {
    startTransition(async () => {
      const result = await payBill(bill.id, today);
      if (result.ok) toast.success(`${bill.title} marcada como paga`);
      else toast.error(result.error);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="Filtro de status">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.value ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button
          className="fixed right-4 bottom-24 z-30 size-14 rounded-full shadow-soft md:static md:size-auto md:rounded-xl"
          onClick={() => openSheet(null)}
        >
          <PlusIcon className="size-5" />
          <span className="max-md:sr-only">Nova conta</span>
        </Button>
      </div>

      <Panel>
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma conta aqui.</p>
        ) : (
          <Stagger key={tab} className="flex flex-col">
            {visible.map((b) => {
              const state = billState(b, today);
              return (
                <StaggerItem key={b.id} className="flex items-center gap-2 rounded-2xl transition-colors hover:bg-muted/60">
                  <button type="button" onClick={() => openSheet(b)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl p-2.5 text-left">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDate(b.dueDate)} · {categoryName.get(b.categoryId)}
                        {b.recurrence.frequency !== "none" && " · recorrente"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatCents(b.amount)}</p>
                      <span className={cn("mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium", stateStyles[state])}>
                        {dueLabel(b, today)}
                      </span>
                    </div>
                  </button>
                  {b.status === "pending" && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="mr-2 shrink-0 rounded-full"
                      disabled={pending}
                      onClick={() => onPay(b)}
                      aria-label={`Marcar ${b.title} como paga`}
                    >
                      <CheckIcon className="size-4" />
                    </Button>
                  )}
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </Panel>

      <BillFormSheet open={open} onOpenChange={setOpen} bill={editing} categories={categories} accounts={accounts} uid={uid} />
    </>
  );
}
