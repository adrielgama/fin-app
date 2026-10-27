import { format } from "date-fns";
import { Panel } from "@/components/finance/section";
import { TransactionList } from "@/components/finance/transaction-list";
import { Reveal } from "@/components/motion/reveal";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/repository";

export const metadata = { title: "Lançamentos" };

export default async function LancamentosPage() {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const month = format(new Date(), "yyyy-MM");

  const [transactions, categories, accounts] = await Promise.all([
    repo.listTransactions({ month }),
    repo.listCategories(),
    repo.listAccounts(),
  ]);
  const rows = transactions.toSorted((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
      </Reveal>
      <Reveal delay={0.08}>
        <Panel>
          <TransactionList transactions={rows} categories={categories} accounts={accounts} />
        </Panel>
      </Reveal>
    </div>
  );
}
