import { format } from "date-fns";
import { BalanceHero } from "@/components/finance/balance-hero";
import { CardUsage } from "@/components/finance/card-usage";
import { Panel, Section } from "@/components/finance/section";
import { SpendingDonut } from "@/components/finance/spending-donut";
import { TransactionList } from "@/components/finance/transaction-list";
import { Reveal } from "@/components/motion/reveal";
import { cardSummaries, categoryBreakdown, sumBy } from "@/lib/analytics";
import { requireUser } from "@/lib/auth/session";
import { formatCents, formatDate } from "@/lib/format";
import { getRepository } from "@/lib/repository";

export const metadata = { title: "Início" };

export default async function DashboardPage() {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const month = format(new Date(), "yyyy-MM");

  const [transactions, bills, accounts, categories] = await Promise.all([
    repo.listTransactions({ month }),
    repo.listBills(),
    repo.listAccounts(),
    repo.listCategories(),
  ]);

  const income = sumBy(transactions, "income");
  const expense = sumBy(transactions, "expense");
  const slices = categoryBreakdown(transactions, categories);
  const cards = cardSummaries(accounts, transactions);
  const recent = transactions.toSorted((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const upcoming = bills
    .filter((b) => b.status === "pending")
    .toSorted((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-6">
        <Reveal>
          <BalanceHero name={user.name.split(" ")[0]} balance={income - expense} income={income} expense={expense} />
        </Reveal>

        <Reveal delay={0.1}>
          <Section title="Meus cartões" href="/cartoes">
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0">
              {cards.map((c) => (
                <CardUsage key={c.account.id} summary={c} />
              ))}
            </div>
          </Section>
        </Reveal>

        <Reveal delay={0.15}>
          <Section title="Próximos vencimentos">
            <Panel>
              <ul className="flex flex-col gap-1">
                {upcoming.map((bill) => (
                  <li key={bill.id} className="flex items-center justify-between rounded-2xl p-2.5 text-sm hover:bg-muted/60">
                    <span className="font-medium">
                      {bill.title}
                      <span className="block text-xs font-normal text-muted-foreground">{formatDate(bill.dueDate)}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{formatCents(bill.amount)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </Section>
        </Reveal>
      </div>

      <div className="flex flex-col gap-6">
        <Reveal delay={0.12}>
          <Section title="Gastos por categoria" href="/gastos" linkLabel="Detalhes">
            <Panel>
              <SpendingDonut slices={slices.slice(0, 5)} total={expense} />
            </Panel>
          </Section>
        </Reveal>

        <Reveal delay={0.2}>
          <Section title="Últimos lançamentos" href="/lancamentos">
            <Panel>
              <TransactionList transactions={recent} categories={categories} accounts={accounts} />
            </Panel>
          </Section>
        </Reveal>
      </div>
    </div>
  );
}
