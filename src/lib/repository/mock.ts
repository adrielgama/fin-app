import type { Transaction } from "@/lib/schemas";
import type { FinanceRepository } from "./types";
import { accounts, buildBills, buildIncomeEntries, buildTransactions, categories } from "./mock-data";

interface MockStore {
  transactions: Transaction[];
}

const globalStore = globalThis as typeof globalThis & { __finMockStore?: MockStore };

function getStore(): MockStore {
  globalStore.__finMockStore ??= { transactions: buildTransactions(new Date()) };
  return globalStore.__finMockStore;
}

const inMonth = (date: string, month?: string) => !month || date.startsWith(month);

export function createMockRepository(): FinanceRepository {
  const store = getStore();
  const now = new Date();
  const incomeEntries = buildIncomeEntries(now);
  const bills = buildBills(now);

  const indexOf = (id: string) => {
    const index = store.transactions.findIndex((t) => t.id === id);
    if (index < 0) throw new Error("Lançamento não encontrado");
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
      const index = indexOf(id);
      const updated: Transaction = { ...store.transactions[index], ...input };
      store.transactions[index] = updated;
      return updated;
    },
    deleteTransaction: async (id) => {
      store.transactions.splice(indexOf(id), 1);
    },
    listIncomeEntries: async ({ month } = {}) => incomeEntries.filter((e) => inMonth(e.date, month)),
    listBills: async () => bills,
  };
}
