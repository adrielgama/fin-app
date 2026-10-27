import type { Account, Bill, Category, IncomeEntry, Transaction } from "@/lib/schemas";

export interface MonthFilter {
  month?: string;
}

export interface FinanceRepository {
  listAccounts(): Promise<Account[]>;
  listCategories(): Promise<Category[]>;
  listTransactions(filter?: MonthFilter): Promise<Transaction[]>;
  listIncomeEntries(filter?: MonthFilter): Promise<IncomeEntry[]>;
  listBills(): Promise<Bill[]>;
}
