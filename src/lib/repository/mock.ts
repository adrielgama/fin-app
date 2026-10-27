import type { FinanceRepository } from "./types";
import { accounts, buildBills, buildIncomeEntries, buildTransactions, categories } from "./mock-data";

const inMonth = (date: string, month?: string) => !month || date.startsWith(month);

export function createMockRepository(): FinanceRepository {
  const now = new Date();
  const transactions = buildTransactions(now);
  const incomeEntries = buildIncomeEntries(now);
  const bills = buildBills(now);

  return {
    listAccounts: async () => accounts,
    listCategories: async () => categories,
    listTransactions: async ({ month } = {}) => transactions.filter((t) => inMonth(t.date, month)),
    listIncomeEntries: async ({ month } = {}) => incomeEntries.filter((e) => inMonth(e.date, month)),
    listBills: async () => bills,
  };
}
