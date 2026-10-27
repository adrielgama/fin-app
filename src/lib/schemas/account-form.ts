import { z } from "zod";
import { centsToInput, parseMoneyToCents } from "@/lib/money";
import { accountTypeSchema, type Account, type AccountInput } from "./account";

const day = z.string().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 31), "Dia entre 1 e 31");

export const accountFormSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome").max(60),
    type: accountTypeSchema,
    initialBalance: z.string().refine((v) => v === "" || parseMoneyToCents(v) !== null, "Valor inválido"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    creditLimit: z.string().refine((v) => v === "" || (parseMoneyToCents(v) ?? -1) >= 0, "Valor inválido"),
    closingDay: day,
    dueDay: day,
    lastDigits: z.string().refine((v) => v === "" || /^\d{4}$/.test(v), "4 dígitos"),
  })
  .refine((v) => v.type !== "credit_card" || parseMoneyToCents(v.creditLimit) !== null, {
    path: ["creditLimit"],
    message: "Informe o limite",
  });

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export function accountFormToInput(v: AccountFormValues): AccountInput {
  const card = v.type === "credit_card";
  return {
    name: v.name,
    type: v.type,
    initialBalance: card ? 0 : (parseMoneyToCents(v.initialBalance) ?? 0),
    color: v.color,
    creditLimit: card ? (parseMoneyToCents(v.creditLimit) ?? 0) : null,
    closingDay: card && v.closingDay ? Number(v.closingDay) : null,
    dueDay: card && v.dueDay ? Number(v.dueDay) : null,
    lastDigits: card && v.lastDigits ? v.lastDigits : null,
    archived: false,
  };
}

export const accountToFormValues = (a: Account): AccountFormValues => ({
  name: a.name,
  type: a.type,
  initialBalance: a.initialBalance ? centsToInput(a.initialBalance) : "",
  color: a.color,
  creditLimit: a.creditLimit === null ? "" : centsToInput(a.creditLimit),
  closingDay: a.closingDay?.toString() ?? "",
  dueDay: a.dueDay?.toString() ?? "",
  lastDigits: a.lastDigits ?? "",
});
