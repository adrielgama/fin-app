import { z } from "zod";
import { idSchema } from "./common";

export const categorySchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(40),
  kind: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const categoryInputSchema = categorySchema.omit({ id: true });

export type Category = z.infer<typeof categorySchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
