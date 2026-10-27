import Link from "next/link";
import { addMonths, format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function MonthNav({ month, basePath }: { month: string; basePath: string }) {
  const current = parse(month, "yyyy-MM", new Date());
  const href = (offset: number) => `${basePath}?mes=${format(addMonths(current, offset), "yyyy-MM")}`;

  return (
    <div className="flex items-center gap-1">
      <Link href={href(-1)} aria-label="Mês anterior" className={buttonVariants({ variant: "ghost", size: "icon" })}>
        <ChevronLeftIcon className="size-4" />
      </Link>
      <span className="min-w-32 text-center text-sm font-medium capitalize">{format(current, "MMMM yyyy", { locale: ptBR })}</span>
      <Link href={href(1)} aria-label="Próximo mês" className={buttonVariants({ variant: "ghost", size: "icon" })}>
        <ChevronRightIcon className="size-4" />
      </Link>
    </div>
  );
}
