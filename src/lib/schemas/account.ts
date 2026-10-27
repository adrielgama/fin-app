import { z } from "zod";
import { centsSchema, idSchema } from "./common";

export const accountTypeSchema = z.enum(["checking", "savings", "credit_card", "cash", "investment"]);

export const accountSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(60),
  type: accountTypeSchema,
  initialBalance: z.number().int(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  creditLimit: centsSchema.nullable().default(null),
  closingDay: z.number().int().min(1).max(31).nullable().default(null),
  dueDay: z.number().int().min(1).max(31).nullable().default(null),
  lastDigits: z.string().regex(/^\d{4}$/).nullable().default(null),
  archived: z.boolean().default(false),
});

export const accountInputSchema = accountSchema.omit({ id: true });

export type Account = z.infer<typeof accountSchema>;
export type AccountInput = z.infer<typeof accountInputSchema>;
