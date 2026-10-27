import { z } from "zod";
import { centsToInput, parseMoneyToCents } from "@/lib/money";
import { isoDateSchema } from "./common";
import { paymentMethodSchema, type Transaction, type TransactionInput } from "./transaction";

export const transactionFormSchema = z
  .object({
    kind: z.enum(["income", "expense"]),
    description: z.string().trim().min(1, "Informe a descrição").max(120),
    amount: z.string().refine((v) => (parseMoneyToCents(v) ?? 0) > 0, "Valor inválido"),
    date: isoDateSchema,
    categoryId: z.string().min(1, "Selecione a categoria"),
    accountId: z.string().min(1, "Selecione a conta"),
    paymentMethod: paymentMethodSchema,
    frequency: z.enum(["none", "weekly", "monthly", "yearly"]),
    interval: z.string().regex(/^\d+$/, "Número inteiro"),
    endDate: z.union([isoDateSchema, z.literal("")]),
    notes: z.string().max(500),
  })
  .refine((v) => v.frequency === "none" || (Number(v.interval) >= 1 && Number(v.interval) <= 12), {
    path: ["interval"],
    message: "Entre 1 e 12",
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function formValuesToInput(v: TransactionFormValues): TransactionInput {
  return {
    kind: v.kind,
    description: v.description,
    amount: parseMoneyToCents(v.amount) ?? 0,
    date: v.date,
    categoryId: v.categoryId,
    accountId: v.accountId,
    paymentMethod: v.paymentMethod,
    recurrence:
      v.frequency === "none"
        ? { frequency: "none" }
        : { frequency: v.frequency, interval: Number(v.interval), endDate: v.endDate || null },
    incomeEntryId: null,
    billId: null,
    notes: v.notes,
  };
}

export const transactionToFormDefaults = (t: Transaction): TransactionFormValues => ({
  kind: t.kind,
  description: t.description,
  amount: centsToInput(t.amount),
  date: t.date,
  categoryId: t.categoryId,
  accountId: t.accountId,
  paymentMethod: t.paymentMethod,
  frequency: t.recurrence.frequency,
  interval: String(t.recurrence.frequency === "none" ? 1 : t.recurrence.interval),
  endDate: t.recurrence.frequency === "none" ? "" : (t.recurrence.endDate ?? ""),
  notes: t.notes,
});
