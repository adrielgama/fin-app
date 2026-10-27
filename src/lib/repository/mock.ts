import type { Bill, IncomeEntry, Receipt, Transaction } from "@/lib/schemas";
import type { FinanceRepository } from "./types";
import { accounts, buildBills, buildIncomeEntries, buildTransactions, categories } from "./mock-data";

interface MockStore {
  transactions: Transaction[];
  incomeEntries: IncomeEntry[];
  bills: Bill[];
  receiptFiles: Map<string, { contentType: string; bytes: Uint8Array }>;
}

const globalStore = globalThis as typeof globalThis & { __finMockStore?: MockStore };

function getStore(): MockStore {
  globalStore.__finMockStore ??= {
    transactions: buildTransactions(new Date()),
    incomeEntries: buildIncomeEntries(new Date()),
    bills: buildBills(new Date()),
    receiptFiles: new Map(),
  };
  return globalStore.__finMockStore;
}

const inMonth = (date: string, month?: string) => !month || date.startsWith(month);

export const getMockReceiptFiles = () => getStore().receiptFiles;

export function createMockRepository(): FinanceRepository {
  const store = getStore();

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
    listBills: async () => store.bills,
    addReceipt: async (target, meta) => {
      const receipt: Receipt = { ...meta, uploadedAt: new Date().toISOString() };
      const owner = target.kind === "transaction" ? store.transactions : store.bills;
      owner[indexIn(owner, target.id)].receipts.push(receipt);
      return receipt;
    },
    removeReceipt: async (target, receiptId) => {
      const owner = target.kind === "transaction" ? store.transactions : store.bills;
      const { receipts } = owner[indexIn(owner, target.id)];
      const receipt = receipts.find((r) => r.id === receiptId);
      if (!receipt) throw new Error("Comprovante não encontrado");
      receipts.splice(receipts.indexOf(receipt), 1);
      store.receiptFiles.delete(receiptId);
      return receipt;
    },
  };
}
