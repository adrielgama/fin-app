import { z } from "zod";

export const isoDateSchema = z.iso.date();
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato YYYY-MM");
export const centsSchema = z.number().int().nonnegative();
export const idSchema = z.string().min(1);

export const recurrenceSchema = z.discriminatedUnion("frequency", [
  z.object({ frequency: z.literal("none") }),
  z.object({
    frequency: z.enum(["weekly", "monthly", "yearly"]),
    interval: z.number().int().min(1).max(12).default(1),
    endDate: isoDateSchema.nullable().default(null),
  }),
]);

export type Recurrence = z.infer<typeof recurrenceSchema>;
