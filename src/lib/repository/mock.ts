import type { IncomeEntry, Transaction } from "@/lib/schemas";
import type { FinanceRepository } from "./types";
import { accounts, buildBills, buildIncomeEntries, buildTransactions, categories } from "./mock-data";

interface MockStore {
  transactions: Transaction[];
  incomeEntries: IncomeEntry[];
}

const globalStore = globalThis as typeof globalThis & { __finMockStore?: MockStore };

function getStore(): MockStore {
  globalStore.__finMockStore ??= { transactions: buildTransactions(new Date()), incomeEntries: buildIncomeEntries(new Date()) };
  return globalStore.__finMockStore;
}

const inMonth = (date: string, month?: string) => !month || date.startsWith(month);

export function createMockRepository(): FinanceRepository {
  const store = getStore();
  const now = new Date();
  const bills = buildBills(now);

  const indexIn = (list: { id: string }[], id: string) => {
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Registro não encontrado");
    return index;
  };

  return {
    listAccounts: async () => accounts,
    listCategories: async () => categories,
    listTransactions: async ({ month } = {}) => store.transactions.filter((t) => inMonth(t.date, month)),
    createTransaction: async (input) => {
      const created: Transaction = {
        ...input,
        id: crypto.randomUUID(),
        receipts: [],
        createdAt: new Date().toISOString(),
      };
      store.transactions.push(created);
      return created;
    },
    updateTransaction: async (id, input) => {
      const index = indexIn(store.transactions, id);
      const updated: Transaction = { ...store.transactions[index], ...input };
      store.transactions[index] = updated;
      return updated;
    },
    deleteTransaction: async (id) => {
      store.transactions.splice(indexIn(store.transactions, id), 1);
    },
    listIncomeEntries: async ({ month } = {}) => store.incomeEntries.filter((e) => inMonth(e.date, month)),
    createIncomeEntry: async (input) => {
      const created: IncomeEntry = { ...input, id: crypto.randomUUID() };
      store.incomeEntries.push(created);
      return created;
    },
    updateIncomeEntry: async (id, input) => {
      const index = indexIn(store.incomeEntries, id);
      const updated: IncomeEntry = { ...input, id };
      store.incomeEntries[index] = updated;
      return updated;
    },
    deleteIncomeEntry: async (id) => {
      store.incomeEntries.splice(indexIn(store.incomeEntries, id), 1);
    },
    listBills: async () => bills,
  };
}
