import { z } from "zod";
import { centsToInput, parseMoneyToCents } from "@/lib/money";
import { isoDateSchema, monthSchema } from "./common";
import { incomeKindSchema, incomeSourceSchema, type IncomeEntry, type IncomeEntryInput } from "./income";

const money = (message: string) => z.string().refine((v) => v === "" || parseMoneyToCents(v) !== null, message);

export const incomeFormSchema = z
  .object({
    source: incomeSourceSchema,
    kind: incomeKindSchema,
    description: z.string().trim().min(1, "Informe a descrição").max(120),
    grossAmount: z.string().refine((v) => (parseMoneyToCents(v) ?? 0) > 0, "Valor inválido"),
    deductions: money("Valor inválido"),
    date: isoDateSchema,
    competence: monthSchema,
    accountId: z.string().min(1, "Selecione a conta"),
    client: z.string().max(80),
    invoiceNumber: z.string().max(40),
  })
  .refine((v) => (parseMoneyToCents(v.deductions) ?? 0) <= (parseMoneyToCents(v.grossAmount) ?? 0), {
    path: ["deductions"],
    message: "Maior que o bruto",
  });

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;

export const incomeKindsBySource = {
  clt: [
    { value: "salary", label: "Salário" },
    { value: "advance", label: "Adiantamento" },
  ],
  pj: [
    { value: "invoice", label: "Nota fiscal" },
    { value: "tax", label: "Imposto" },
  ],
} as const;

export function incomeFormToInput(v: IncomeFormValues): IncomeEntryInput {
  return {
    source: v.source,
    kind: v.kind,
    description: v.description,
    grossAmount: parseMoneyToCents(v.grossAmount) ?? 0,
    deductions: v.kind === "tax" ? 0 : (parseMoneyToCents(v.deductions) ?? 0),
    date: v.date,
    competence: v.competence,
    accountId: v.accountId,
    client: v.source === "pj" && v.client ? v.client : null,
    invoiceNumber: v.source === "pj" && v.invoiceNumber ? v.invoiceNumber : null,
  };
}

export const incomeToFormValues = (e: IncomeEntry): IncomeFormValues => ({
  source: e.source,
  kind: e.kind,
  description: e.description,
  grossAmount: centsToInput(e.grossAmount),
  deductions: e.deductions ? centsToInput(e.deductions) : "",
  date: e.date,
  competence: e.competence,
  accountId: e.accountId,
  client: e.client ?? "",
  invoiceNumber: e.invoiceNumber ?? "",
});
