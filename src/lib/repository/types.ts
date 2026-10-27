import type { Account, Bill, Category, IncomeEntry, Transaction, TransactionInput } from "@/lib/schemas";

export interface MonthFilter {
  month?: string;
}

export interface FinanceRepository {
  listAccounts(): Promise<Account[]>;
  listCategories(): Promise<Category[]>;
  listTransactions(filter?: MonthFilter): Promise<Transaction[]>;
  createTransaction(input: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, input: TransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  listIncomeEntries(filter?: MonthFilter): Promise<IncomeEntry[]>;
  listBills(): Promise<Bill[]>;
}
