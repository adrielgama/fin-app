"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { IncomeFormSheet } from "@/components/finance/income-form-sheet";
import { Panel, Section } from "@/components/finance/section";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { formatCents, formatDate } from "@/lib/format";
import { netAmount, type Account, type IncomeEntry } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const kindLabels: Record<IncomeEntry["kind"], string> = {
  salary: "Salário",
  advance: "Adiantamento",
  invoice: "Nota fiscal",
  tax: "Imposto",
};

function EntryList({ entries, onSelect }: { entries: IncomeEntry[]; onSelect: (entry: IncomeEntry) => void }) {
  if (!entries.length) return <p className="py-6 text-center text-sm text-muted-foreground">Sem registros neste mês.</p>;

  return (
    <Stagger className="flex flex-col">
      {entries.map((e) => {
        const tax = e.kind === "tax";
        return (
          <StaggerItem key={e.id} className="rounded-2xl transition-colors hover:bg-muted/60">
            <button type="button" onClick={() => onSelect(e)} className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2.5 text-left">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {e.description}
                  {e.invoiceNumber && <span className="text-muted-foreground"> · NF {e.invoiceNumber}</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {kindLabels[e.kind]} · {formatDate(e.date)}
                  {e.client && ` · ${e.client}`}
                </p>
              </div>
              <div className="text-right">
                <p className={cn("text-sm font-semibold tabular-nums", tax ? "text-destructive" : "text-success")}>
                  {tax ? "-" : "+"}
                  {formatCents(tax ? e.grossAmount : netAmount(e))}
                </p>
                {e.deductions > 0 && (
                  <p className="text-xs text-muted-foreground tabular-nums">bruto {formatCents(e.grossAmount)}</p>
                )}
              </div>
            </button>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

export function IncomeManager({ entries, accounts }: { entries: IncomeEntry[]; accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeEntry | null>(null);

  function openSheet(entry: IncomeEntry | null) {
    setEditing(entry);
    setOpen(true);
  }

  return (
    <>
      <Button
        className="fixed right-4 bottom-24 z-30 size-14 rounded-full shadow-soft md:static md:size-auto md:self-end md:rounded-xl"
        onClick={() => openSheet(null)}
      >
        <PlusIcon className="size-5" />
        <span className="max-md:sr-only">Nova renda</span>
      </Button>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="CLT">
          <Panel>
            <EntryList entries={entries.filter((e) => e.source === "clt")} onSelect={openSheet} />
          </Panel>
        </Section>
        <Section title="PJ">
          <Panel>
            <EntryList entries={entries.filter((e) => e.source === "pj")} onSelect={openSheet} />
          </Panel>
        </Section>
      </div>
      <IncomeFormSheet open={open} onOpenChange={setOpen} entry={editing} accounts={accounts} />
    </>
  );
}
