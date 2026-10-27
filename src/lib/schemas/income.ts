import { z } from "zod";
import { centsSchema, idSchema, isoDateSchema, monthSchema } from "./common";

export const incomeSourceSchema = z.enum(["clt", "pj"]);
export const incomeKindSchema = z.enum(["salary", "advance", "invoice", "tax"]);

const incomeBaseSchema = z.object({
  source: incomeSourceSchema,
  kind: incomeKindSchema,
  description: z.string().min(1).max(120),
  grossAmount: centsSchema,
  deductions: centsSchema.default(0),
  date: isoDateSchema,
  competence: monthSchema,
  accountId: idSchema,
  client: z.string().max(80).nullable().default(null),
  invoiceNumber: z.string().max(40).nullable().default(null),
});

type IncomeBase = z.infer<typeof incomeBaseSchema>;

const withIncomeRules = <T extends z.ZodType<IncomeBase>>(schema: T) =>
  schema
    .refine((e) => e.deductions <= e.grossAmount, { path: ["deductions"], message: "Descontos maiores que o bruto" })
    .refine((e) => (e.source === "clt" ? e.kind === "salary" || e.kind === "advance" : e.kind === "invoice" || e.kind === "tax"), {
      path: ["kind"],
      message: "Tipo incompatível com a fonte",
    });

export const incomeEntrySchema = withIncomeRules(incomeBaseSchema.extend({ id: idSchema }));
export const incomeEntryInputSchema = withIncomeRules(incomeBaseSchema);

export type IncomeEntry = z.infer<typeof incomeEntrySchema>;
export type IncomeEntryInput = z.infer<typeof incomeEntryInputSchema>;

export const netAmount = (e: Pick<IncomeEntry, "grossAmount" | "deductions" | "kind">) =>
  e.kind === "tax" ? 0 : e.grossAmount - e.deductions;
