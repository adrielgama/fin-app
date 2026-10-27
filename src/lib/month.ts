import { format } from "date-fns";
import { monthSchema } from "@/lib/schemas";

export function resolveMonth(param: string | string[] | undefined): string {
  const parsed = monthSchema.safeParse(Array.isArray(param) ? param[0] : param);
  return parsed.success ? parsed.data : format(new Date(), "yyyy-MM");
}
