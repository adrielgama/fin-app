"use client";

import { motion } from "motion/react";
import { CreditCardVisual } from "@/components/finance/credit-card-visual";
import type { CardSummary } from "@/lib/analytics";
import { formatCents } from "@/lib/format";

export function CardUsage({ summary }: { summary: CardSummary }) {
  const { account, used, limit, available, usedPct } = summary;
  const danger = usedPct > 0.8;

  return (
    <div className="flex w-72 shrink-0 snap-center flex-col gap-3">
      <CreditCardVisual name={account.name} color={account.color} lastDigits={account.lastDigits} />
      <div className="rounded-2xl bg-card p-4 shadow-soft ring-1 ring-foreground/5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Fatura atual</span>
          <span className="font-semibold tabular-nums">{formatCents(used)}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={danger ? "h-full rounded-full bg-destructive" : "h-full rounded-full bg-primary"}
            initial={{ width: 0 }}
            animate={{ width: `${usedPct * 100}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Disponível {formatCents(available)}</span>
          <span>Limite {formatCents(limit)}</span>
        </div>
        {account.closingDay && account.dueDay ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Fecha dia {account.closingDay} · vence dia {account.dueDay}
          </p>
        ) : null}
      </div>
    </div>
  );
}
