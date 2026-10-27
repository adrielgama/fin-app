import type { Account, Category, Transaction } from "@/lib/schemas";

export interface CategorySlice {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  pct: number;
}

export function sumBy(transactions: Transaction[], kind: Transaction["kind"]) {
  return transactions.reduce((sum, t) => (t.kind === kind ? sum + t.amount : sum), 0);
}

export function categoryBreakdown(transactions: Transaction[], categories: Category[]): CategorySlice[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind === "expense") totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  const all = [...totals.values()].reduce((a, b) => a + b, 0);
  const byId = new Map(categories.map((c) => [c.id, c]));

  return [...totals.entries()]
    .flatMap(([id, total]) => {
      const c = byId.get(id);
      return c ? [{ id, name: c.name, icon: c.icon, color: c.color, total, pct: all ? total / all : 0 }] : [];
    })
    .toSorted((a, b) => b.total - a.total);
}

export interface CardSummary {
  account: Account;
  used: number;
  limit: number;
  available: number;
  usedPct: number;
}

export function cardSummaries(accounts: Account[], transactions: Transaction[]): CardSummary[] {
  return accounts
    .filter((a) => a.type === "credit_card" && !a.archived)
    .map((account) => {
      const used = transactions
        .filter((t) => t.accountId === account.id && t.kind === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      const limit = account.creditLimit ?? 0;
      return { account, used, limit, available: Math.max(limit - used, 0), usedPct: limit ? Math.min(used / limit, 1) : 0 };
    });
}
