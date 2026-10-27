import { z } from "zod";
import { idSchema } from "./common";

export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
export const RECEIPT_CONTENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

export const receiptSchema = z.object({
  id: idSchema,
  storagePath: z.string().min(1),
  fileName: z.string().min(1).max(200),
  contentType: z.enum(RECEIPT_CONTENT_TYPES),
  size: z.number().int().positive().max(RECEIPT_MAX_BYTES),
  uploadedAt: z.iso.datetime(),
});

export type Receipt = z.infer<typeof receiptSchema>;
