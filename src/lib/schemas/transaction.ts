import { z } from "zod";
import { centsSchema, idSchema, isoDateSchema, recurrenceSchema } from "./common";
import { receiptSchema } from "./receipt";

export const paymentMethodSchema = z.enum(["pix", "credit", "debit", "cash", "boleto", "transfer", "other"]);

export const transactionSchema = z.object({
  id: idSchema,
  kind: z.enum(["income", "expense"]),
  description: z.string().min(1).max(120),
  amount: centsSchema.positive(),
  date: isoDateSchema,
  categoryId: idSchema,
  accountId: idSchema,
  paymentMethod: paymentMethodSchema,
  recurrence: recurrenceSchema.default({ frequency: "none" }),
  receipts: z.array(receiptSchema).default([]),
  incomeEntryId: idSchema.nullable().default(null),
  billId: idSchema.nullable().default(null),
  notes: z.string().max(500).default(""),
  createdAt: z.iso.datetime(),
});

export const transactionInputSchema = transactionSchema.omit({ id: true, createdAt: true, receipts: true });

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionInput = z.infer<typeof transactionInputSchema>;
