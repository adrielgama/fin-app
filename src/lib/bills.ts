import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Bill } from "@/lib/schemas";

export type BillState = "paid" | "overdue" | "today" | "soon" | "later";

export function billState(bill: Bill, today: string): BillState {
  if (bill.status === "paid") return "paid";
  const days = differenceInCalendarDays(parseISO(bill.dueDate), parseISO(today));
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  return days <= 7 ? "soon" : "later";
}

export function dueLabel(bill: Bill, today: string): string {
  if (bill.status === "paid") return "Paga";
  const days = differenceInCalendarDays(parseISO(bill.dueDate), parseISO(today));
  if (days < 0) return `Vencida há ${-days} d`;
  if (days === 0) return "Vence hoje";
  return days === 1 ? "Vence amanhã" : `Vence em ${days} d`;
}

export function billTotals(bills: Bill[], today: string) {
  const totals = { overdue: 0, soon: 0, pending: 0 };
  for (const b of bills) {
    const state = billState(b, today);
    if (state === "paid") continue;
    totals.pending += b.amount;
    if (state === "overdue") totals.overdue += b.amount;
    if (state === "today" || state === "soon") totals.soon += b.amount;
  }
  return totals;
}
