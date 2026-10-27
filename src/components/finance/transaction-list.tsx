import { ArrowDownLeftIcon } from "lucide-react";
import { CategoryIcon } from "@/components/finance/category-icon";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { formatCents, formatDate } from "@/lib/format";
import type { Account, Category, Transaction } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

export function TransactionList({ transactions, categories, accounts }: TransactionListProps) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));

  return (
    <Stagger className="flex flex-col">
      {transactions.map((t) => {
        const category = categoryById.get(t.categoryId);
        const income = t.kind === "income";
        return (
          <StaggerItem
            key={t.id}
            className="flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-muted/60"
          >
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full",
                income ? "bg-success/15 text-success" : "bg-primary/12 text-primary",
              )}
            >
              {category ? <CategoryIcon name={category.icon} className="size-4.5" /> : <ArrowDownLeftIcon className="size-4.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.description}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDate(t.date)} · {accountName.get(t.accountId)}
              </p>
            </div>
            <span className={cn("text-sm font-semibold tabular-nums", income && "text-success")}>
              {income ? "+" : "-"}
              {formatCents(t.amount)}
            </span>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
