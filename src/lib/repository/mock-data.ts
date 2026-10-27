import { addMonths, format } from "date-fns";
import type { Account, Bill, Category, IncomeEntry, Transaction } from "@/lib/schemas";

export const accounts: Account[] = [
  { id: "acc-nubank", name: "Nubank", type: "checking", initialBalance: 250000, color: "#8a05be", archived: false },
  { id: "acc-itau", name: "Itaú", type: "checking", initialBalance: 480000, color: "#ec7000", archived: false },
  { id: "acc-card", name: "Cartão Nubank", type: "credit_card", initialBalance: 0, color: "#6d28d9", archived: false },
];

export const categories: Category[] = [
  { id: "cat-moradia", name: "Moradia", kind: "expense", color: "#2563eb" },
  { id: "cat-mercado", name: "Mercado", kind: "expense", color: "#16a34a" },
  { id: "cat-transporte", name: "Transporte", kind: "expense", color: "#ca8a04" },
  { id: "cat-lazer", name: "Lazer", kind: "expense", color: "#db2777" },
  { id: "cat-saude", name: "Saúde", kind: "expense", color: "#dc2626" },
  { id: "cat-impostos", name: "Impostos", kind: "expense", color: "#475569" },
  { id: "cat-salario", name: "Salário", kind: "income", color: "#059669" },
  { id: "cat-freela", name: "Notas PJ", kind: "income", color: "#0891b2" },
];

const none = { frequency: "none" } as const;
const monthly = { frequency: "monthly", interval: 1, endDate: null } as const;

export function buildTransactions(now = new Date()): Transaction[] {
  const result: Transaction[] = [];
  for (let back = 5; back >= 0; back--) {
    const ym = format(addMonths(now, -back), "yyyy-MM");
    const base = {
      receipts: [],
      incomeEntryId: null,
      billId: null,
      notes: "",
      createdAt: `${ym}-01T12:00:00.000Z`,
    };
    const tx = (
      key: string,
      day: string,
      kind: Transaction["kind"],
      description: string,
      amount: number,
      categoryId: string,
      accountId: string,
      paymentMethod: Transaction["paymentMethod"],
      recurrence: Transaction["recurrence"] = none,
    ): Transaction => ({
      ...base,
      id: `${ym}-${key}`,
      date: `${ym}-${day}`,
      kind,
      description,
      amount,
      categoryId,
      accountId,
      paymentMethod,
      recurrence,
    });

    result.push(
      tx("salario", "05", "income", "Salário CLT", 650000, "cat-salario", "acc-itau", "transfer", monthly),
      tx("pj", "15", "income", `NF PJ ${ym}`, 420000 + back * 15000, "cat-freela", "acc-nubank", "pix"),
      tx("aluguel", "08", "expense", "Aluguel", 230000, "cat-moradia", "acc-itau", "boleto", monthly),
      tx("mercado1", "10", "expense", "Supermercado", 62000 + back * 3000, "cat-mercado", "acc-card", "credit"),
      tx("mercado2", "22", "expense", "Supermercado", 48000, "cat-mercado", "acc-card", "credit"),
      tx("uber", "12", "expense", "Transporte por app", 21000 + back * 1500, "cat-transporte", "acc-card", "credit"),
      tx("cinema", "18", "expense", "Cinema e jantar", 18500, "cat-lazer", "acc-nubank", "pix"),
      tx("saude", "20", "expense", "Plano de saúde", 54000, "cat-saude", "acc-itau", "debit", monthly),
      tx("das", "20", "expense", "DAS (Simples)", 36000, "cat-impostos", "acc-nubank", "boleto", monthly),
    );
  }
  return result;
}

export function buildIncomeEntries(now = new Date()): IncomeEntry[] {
  const result: IncomeEntry[] = [];
  for (let back = 5; back >= 0; back--) {
    const ym = format(addMonths(now, -back), "yyyy-MM");
    result.push(
      {
        id: `${ym}-clt-adv`,
        source: "clt",
        kind: "advance",
        description: "Adiantamento salarial",
        grossAmount: 260000,
        deductions: 0,
        date: `${ym}-20`,
        competence: ym,
        accountId: "acc-itau",
        client: null,
        invoiceNumber: null,
      },
      {
        id: `${ym}-clt-sal`,
        source: "clt",
        kind: "salary",
        description: "Salário CLT",
        grossAmount: 820000,
        deductions: 170000,
        date: `${ym}-05`,
        competence: ym,
        accountId: "acc-itau",
        client: null,
        invoiceNumber: null,
      },
      {
        id: `${ym}-pj-nf`,
        source: "pj",
        kind: "invoice",
        description: "Nota fiscal",
        grossAmount: 420000 + back * 15000,
        deductions: 0,
        date: `${ym}-15`,
        competence: ym,
        accountId: "acc-nubank",
        client: "Acme Ltda",
        invoiceNumber: String(100 + back),
      },
      {
        id: `${ym}-pj-das`,
        source: "pj",
        kind: "tax",
        description: "DAS Simples Nacional",
        grossAmount: 36000,
        deductions: 0,
        date: `${ym}-20`,
        competence: ym,
        accountId: "acc-nubank",
        client: null,
        invoiceNumber: null,
      },
    );
  }
  return result;
}

export function buildBills(now = new Date()): Bill[] {
  const ym = format(now, "yyyy-MM");
  const next = format(addMonths(now, 1), "yyyy-MM");
  const bill = (id: string, title: string, amount: number, dueDate: string, categoryId: string, status: Bill["status"] = "pending"): Bill => ({
    id,
    title,
    amount,
    dueDate,
    status,
    paidAt: status === "paid" ? dueDate : null,
    categoryId,
    accountId: "acc-itau",
    recurrence: monthly,
    reminderDaysBefore: [3, 0],
    receipts: [],
    transactionId: null,
  });
  return [
    bill("bill-aluguel", "Aluguel", 230000, `${ym}-28`, "cat-moradia"),
    bill("bill-internet", "Internet", 12990, `${ym}-30`, "cat-moradia"),
    bill("bill-plano", "Plano de saúde", 54000, `${next}-10`, "cat-saude"),
    bill("bill-das", "DAS (Simples)", 36000, `${next}-20`, "cat-impostos"),
    bill("bill-energia", "Energia", 18700, `${ym}-05`, "cat-moradia", "paid"),
  ];
}
