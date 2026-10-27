import { format } from "date-fns";
import { BillsManager } from "@/components/finance/bills-manager";
import { Reveal } from "@/components/motion/reveal";
import { requireUser } from "@/lib/auth/session";
import { billTotals } from "@/lib/bills";
import { formatCents } from "@/lib/format";
import { getRepository } from "@/lib/repository";
import { cn } from "@/lib/utils";

export const metadata = { title: "Contas a pagar" };

export default async function ContasPage() {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const today = format(new Date(), "yyyy-MM-dd");

  const [bills, categories, accounts] = await Promise.all([repo.listBills(), repo.listCategories(), repo.listAccounts()]);
  const totals = billTotals(bills, today);

  const stats = [
    { label: "Vencidas", value: totals.overdue, danger: totals.overdue > 0 },
    { label: "Próximos 7 dias", value: totals.soon, danger: false },
    { label: "Total pendente", value: totals.pending, danger: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <h1 className="text-2xl font-semibold">Contas a pagar</h1>
      </Reveal>
      <Reveal delay={0.06} className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, danger }) => (
          <div key={label} className="rounded-2xl bg-card p-4 shadow-soft ring-1 ring-foreground/5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("mt-1 text-base font-semibold tabular-nums sm:text-lg", danger && "text-destructive")}>{formatCents(value)}</p>
          </div>
        ))}
      </Reveal>
      <Reveal delay={0.12} className="flex flex-col gap-4">
        <BillsManager bills={bills} categories={categories} accounts={accounts} today={today} uid={user.uid} />
      </Reveal>
    </div>
  );
}
