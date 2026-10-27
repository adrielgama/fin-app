import type { Account, Category, Transaction } from "@/lib/schemas";

export interface SheetRow {
  id: string;
  date: string;
  kind: Transaction["kind"];
  description: string;
  category: string;
  account: string;
  paymentMethod: string;
  recurrence: string;
  amount: number;
  notes: string;
}

export const sortKeys = ["date", "description", "category", "account", "amount"] as const;
export type SortKey = (typeof sortKeys)[number];

export interface SheetFilters {
  q: string;
  kind: "all" | Transaction["kind"];
  category: string;
  account: string;
  sort: SortKey;
  dir: "asc" | "desc";
}

export const defaultFilters: SheetFilters = { q: "", kind: "all", category: "", account: "", sort: "date", dir: "desc" };

const paymentLabels: Record<Transaction["paymentMethod"], string> = {
  pix: "Pix",
  credit: "Crédito",
  debit: "Débito",
  cash: "Dinheiro",
  boleto: "Boleto",
  transfer: "Transferência",
  other: "Outro",
};

const recurrenceLabels = { none: "Não repete", weekly: "Semanal", monthly: "Mensal", yearly: "Anual" } as const;

export function buildSheetRows(transactions: Transaction[], categories: Category[], accounts: Account[]): SheetRow[] {
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));

  return transactions.map((t) => ({
    id: t.id,
    date: t.date,
    kind: t.kind,
    description: t.description,
    category: categoryName.get(t.categoryId) ?? "—",
    account: accountName.get(t.accountId) ?? "—",
    paymentMethod: paymentLabels[t.paymentMethod],
    recurrence: recurrenceLabels[t.recurrence.frequency],
    amount: (t.kind === "income" ? t.amount : -t.amount) / 100,
    notes: t.notes,
  }));
}

export function applyFilters(rows: SheetRow[], f: SheetFilters): SheetRow[] {
  const q = f.q.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (f.kind === "all" || r.kind === f.kind) &&
      (!f.category || r.category === f.category) &&
      (!f.account || r.account === f.account) &&
      (!q || `${r.description} ${r.category} ${r.account} ${r.notes}`.toLowerCase().includes(q)),
  );

  const sign = f.dir === "asc" ? 1 : -1;
  return filtered.toSorted((a, b) => {
    const [x, y] = [a[f.sort], b[f.sort]];
    const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pt-BR");
    return cmp * sign || a.date.localeCompare(b.date);
  });
}

export function parseFilters(params: URLSearchParams): SheetFilters {
  const sort = params.get("sort");
  const kind = params.get("tipo");
  return {
    q: params.get("q") ?? "",
    kind: kind === "income" || kind === "expense" ? kind : "all",
    category: params.get("categoria") ?? "",
    account: params.get("conta") ?? "",
    sort: sortKeys.find((k) => k === sort) ?? "date",
    dir: params.get("dir") === "asc" ? "asc" : "desc",
  };
}

export function filtersToParams(f: SheetFilters, month: string): URLSearchParams {
  const params = new URLSearchParams({ mes: month, sort: f.sort, dir: f.dir });
  if (f.q) params.set("q", f.q);
  if (f.kind !== "all") params.set("tipo", f.kind);
  if (f.category) params.set("categoria", f.category);
  if (f.account) params.set("conta", f.account);
  return params;
}

export const totals = (rows: SheetRow[]) =>
  rows.reduce(
    (acc, r) => ({
      income: acc.income + (r.amount > 0 ? r.amount : 0),
      expense: acc.expense + (r.amount < 0 ? -r.amount : 0),
    }),
    { income: 0, expense: 0 },
  );
