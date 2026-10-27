import { z } from "zod";
import { centsSchema, idSchema, isoDateSchema, recurrenceSchema } from "./common";
import { receiptSchema } from "./receipt";

export const billSchema = z.object({
  id: idSchema,
  title: z.string().min(1).max(120),
  amount: centsSchema.positive(),
  dueDate: isoDateSchema,
  status: z.enum(["pending", "paid"]),
  paidAt: isoDateSchema.nullable().default(null),
  categoryId: idSchema,
  accountId: idSchema,
  recurrence: recurrenceSchema.default({ frequency: "none" }),
  reminderDaysBefore: z.array(z.number().int().min(0).max(30)).max(4).default([3, 0]),
  receipts: z.array(receiptSchema).default([]),
  transactionId: idSchema.nullable().default(null),
});

export const billInputSchema = billSchema.omit({ id: true, status: true, paidAt: true, receipts: true, transactionId: true });

export type Bill = z.infer<typeof billSchema>;
export type BillInput = z.infer<typeof billInputSchema>;
