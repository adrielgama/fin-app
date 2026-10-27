import type { Account, Bill, BillInput, Category, IncomeEntry, IncomeEntryInput, Receipt, ReceiptMeta, ReceiptTarget, Transaction, TransactionInput } from "@/lib/schemas";

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
  createIncomeEntry(input: IncomeEntryInput): Promise<IncomeEntry>;
  updateIncomeEntry(id: string, input: IncomeEntryInput): Promise<IncomeEntry>;
  deleteIncomeEntry(id: string): Promise<void>;
  listBills(): Promise<Bill[]>;
  createBill(input: BillInput): Promise<Bill>;
  updateBill(id: string, input: BillInput): Promise<Bill>;
  deleteBill(id: string): Promise<void>;
  /** Marca como paga, gera o lançamento de despesa e, se recorrente, a próxima ocorrência pendente. */
  payBill(id: string, paidAt: string): Promise<Bill>;
  addReceipt(target: ReceiptTarget, meta: ReceiptMeta): Promise<Receipt>;
  removeReceipt(target: ReceiptTarget, receiptId: string): Promise<Receipt>;
}
