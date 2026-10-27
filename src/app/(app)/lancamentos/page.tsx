import { MonthNav } from "@/components/finance/month-nav";
import { TransactionsManager } from "@/components/finance/transactions-manager";
import { Reveal } from "@/components/motion/reveal";
import { requireUser } from "@/lib/auth/session";
import { resolveMonth } from "@/lib/month";
import { getRepository } from "@/lib/repository";

export const metadata = { title: "Lançamentos" };

export default async function LancamentosPage({ searchParams }: PageProps<"/lancamentos">) {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const month = resolveMonth((await searchParams).mes);

  const [transactions, categories, accounts] = await Promise.all([
    repo.listTransactions({ month }),
    repo.listCategories(),
    repo.listAccounts(),
  ]);
  const rows = transactions.toSorted((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <Reveal className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
        <MonthNav month={month} basePath="/lancamentos" />
      </Reveal>
      <Reveal delay={0.08} className="flex flex-col gap-4">
        <TransactionsManager transactions={rows} categories={categories} accounts={accounts} />
      </Reveal>
    </div>
  );
}
