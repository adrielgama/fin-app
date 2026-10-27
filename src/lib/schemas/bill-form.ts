import { z } from "zod";
import { centsToInput, parseMoneyToCents } from "@/lib/money";
import { isoDateSchema } from "./common";
import type { Bill, BillInput } from "./bill";

export const reminderOptions = [
  { value: 0, label: "No dia" },
  { value: 1, label: "1 dia antes" },
  { value: 3, label: "3 dias antes" },
  { value: 7, label: "7 dias antes" },
] as const;

export const billFormSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o título").max(120),
    amount: z.string().refine((v) => (parseMoneyToCents(v) ?? 0) > 0, "Valor inválido"),
    dueDate: isoDateSchema,
    categoryId: z.string().min(1, "Selecione a categoria"),
    accountId: z.string().min(1, "Selecione a conta"),
    frequency: z.enum(["none", "weekly", "monthly", "yearly"]),
    interval: z.string().regex(/^\d+$/, "Número inteiro"),
    endDate: z.union([isoDateSchema, z.literal("")]),
    reminders: z.array(z.number().int().min(0).max(30)).max(4),
  })
  .refine((v) => v.frequency === "none" || (Number(v.interval) >= 1 && Number(v.interval) <= 12), {
    path: ["interval"],
    message: "Entre 1 e 12",
  });

export type BillFormValues = z.infer<typeof billFormSchema>;

export const billFormToInput = (v: BillFormValues): BillInput => ({
  title: v.title,
  amount: parseMoneyToCents(v.amount) ?? 0,
  dueDate: v.dueDate,
  categoryId: v.categoryId,
  accountId: v.accountId,
  recurrence:
    v.frequency === "none"
      ? { frequency: "none" }
      : { frequency: v.frequency, interval: Number(v.interval), endDate: v.endDate || null },
  reminderDaysBefore: v.reminders,
});

export const billToFormValues = (b: Bill): BillFormValues => ({
  title: b.title,
  amount: centsToInput(b.amount),
  dueDate: b.dueDate,
  categoryId: b.categoryId,
  accountId: b.accountId,
  frequency: b.recurrence.frequency,
  interval: String(b.recurrence.frequency === "none" ? 1 : b.recurrence.interval),
  endDate: b.recurrence.frequency === "none" ? "" : (b.recurrence.endDate ?? ""),
  reminders: b.reminderDaysBefore,
});
