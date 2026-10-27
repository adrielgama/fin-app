import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Account, Bill, Recurrence, Transaction } from "@/lib/schemas";

export interface CashFlowPoint {
  date: string;
  balance: number;
}

export interface CashFlowEvent {
  date: string;
  label: string;
  amount: number;
}

export interface CashFlowForecast {
  startBalance: number;
  points: CashFlowPoint[];
  events: CashFlowEvent[];
  variableDaily: number;
  endBalance: number;
  lowest: CashFlowPoint;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

function* occurrencesAfter(start: string, recurrence: Recurrence, horizon: string): Generator<string> {
  if (recurrence.frequency === "none") return;
  const step = { weekly: addWeeks, monthly: addMonths, yearly: addYears }[recurrence.frequency];
  const base = parseISO(start);
  for (let k = 1; k < 500; k++) {
    const date = iso(step(base, k * recurrence.interval));
    if (date > horizon || (recurrence.endDate && date > recurrence.endDate)) return;
    yield date;
  }
}

function latestPerSeries(transactions: Transaction[]): Transaction[] {
  const latest = new Map<string, Transaction>();
  for (const t of transactions) {
    if (t.recurrence.frequency === "none") continue;
    const key = `${t.kind}|${t.accountId}|${t.categoryId}|${t.description}`;
    const current = latest.get(key);
    if (!current || t.date > current.date) latest.set(key, t);
  }
  return [...latest.values()];
}

export function variableMonthlyAverage(transactions: Transaction[], today: Date, months = 3): number {
  const first = iso(addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -months));
  const currentMonthStart = iso(new Date(today.getFullYear(), today.getMonth(), 1));
  const total = transactions
    .filter((t) => t.kind === "expense" && t.recurrence.frequency === "none" && t.date >= first && t.date < currentMonthStart)
    .reduce((sum, t) => sum + t.amount, 0);
  return total / months;
}

interface ForecastInput {
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
  today: Date;
  days?: number;
}

export function buildCashFlowForecast({ accounts, transactions, bills, today, days = 90 }: ForecastInput): CashFlowForecast {
  const todayIso = iso(today);
  const horizon = iso(addDays(today, days));

  const startBalance =
    accounts.filter((a) => a.type !== "credit_card").reduce((sum, a) => sum + a.initialBalance, 0) +
    transactions
      .filter((t) => t.date <= todayIso)
      .reduce((sum, t) => sum + (t.kind === "income" ? t.amount : -t.amount), 0);

  const events: CashFlowEvent[] = [];

  for (const t of latestPerSeries(transactions)) {
    for (const date of occurrencesAfter(t.date, t.recurrence, horizon)) {
      if (date > todayIso) events.push({ date, label: t.description, amount: t.kind === "income" ? t.amount : -t.amount });
    }
  }

  for (const b of bills) {
    if (b.status === "pending") {
      events.push({ date: b.dueDate < todayIso ? todayIso : b.dueDate, label: b.title, amount: -b.amount });
    }
    for (const date of occurrencesAfter(b.dueDate, b.recurrence, horizon)) {
      if (date > todayIso) events.push({ date, label: b.title, amount: -b.amount });
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date));

  const variableDaily = variableMonthlyAverage(transactions, today) / 30;
  const byDate = new Map<string, number>();
  for (const e of events) byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.amount);

  const points: CashFlowPoint[] = [{ date: todayIso, balance: Math.round(startBalance + (byDate.get(todayIso) ?? 0)) }];
  let balance = points[0].balance;
  for (let i = 1; i <= differenceInCalendarDays(parseISO(horizon), today); i++) {
    const date = iso(addDays(today, i));
    balance += (byDate.get(date) ?? 0) - variableDaily;
    points.push({ date, balance: Math.round(balance) });
  }

  return {
    startBalance,
    points,
    events,
    variableDaily,
    endBalance: points.at(-1)?.balance ?? startBalance,
    lowest: points.reduce((min, p) => (p.balance < min.balance ? p : min), points[0]),
  };
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

export function monthlyEvolution(transactions: Transaction[], today: Date, months = 6): MonthlyPoint[] {
  const points = Array.from({ length: months }, (_, i) => ({
    month: format(addMonths(today, i - months + 1), "yyyy-MM"),
    income: 0,
    expense: 0,
  }));
  const byMonth = new Map(points.map((p) => [p.month, p]));
  for (const t of transactions) {
    const point = byMonth.get(t.date.slice(0, 7));
    if (point) point[t.kind] += t.amount;
  }
  return points;
}
