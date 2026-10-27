"use client";

import { motion } from "motion/react";
import { CategoryIcon } from "@/components/finance/category-icon";
import type { CategorySlice } from "@/lib/analytics";
import { formatCents } from "@/lib/format";

const R = 52;
const C = 2 * Math.PI * R;

export function SpendingDonut({ slices, total }: { slices: CategorySlice[]; total: number }) {
  const offsets = slices.map((_, i) => slices.slice(0, i).reduce((sum, s) => sum + s.pct * C, 0));

  return (
    <div className="flex flex-col gap-6">
      <div className="relative mx-auto size-48">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label="Gastos por categoria">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="14" className="stroke-muted" />
          {slices.map((s, i) => {
            const len = Math.max(s.pct * C - 2, 0);
            return (
              <motion.circle
                key={s.id}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                strokeWidth="14"
                strokeLinecap="round"
                stroke={s.color}
                strokeDashoffset={-offsets[i]}
                initial={{ strokeDasharray: `0 ${C}` }}
                animate={{ strokeDasharray: `${len} ${C - len}` }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total gasto</span>
          <span className="text-lg font-semibold tabular-nums">{formatCents(total)}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {slices.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full text-white"
              style={{ backgroundColor: s.color }}
            >
              <CategoryIcon name={s.icon} className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between text-sm">
                <span className="truncate font-medium">{s.name}</span>
                <span className="tabular-nums">{formatCents(s.total)}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{Math.round(s.pct * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
