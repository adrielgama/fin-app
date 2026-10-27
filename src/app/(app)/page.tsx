import { format } from "date-fns";
import { BalanceHero } from "@/components/finance/balance-hero";
import { CardUsage } from "@/components/finance/card-usage";
import { Panel, Section } from "@/components/finance/section";
import { SpendingDonut } from "@/components/finance/spending-donut";
import { TransactionList } from "@/components/finance/transaction-list";
import { CashFlowChart, MonthlyEvolutionChart } from "@/components/finance/charts";
import { Reveal } from "@/components/motion/reveal";
import { cardSummaries, categoryBreakdown, sumBy } from "@/lib/analytics";
import { requireUser } from "@/lib/auth/session";
import { buildCashFlowForecast, monthlyEvolution } from "@/lib/forecast";
import { formatCents, formatDate } from "@/lib/format";
import { getRepository } from "@/lib/repository";

export const metadata = { title: "Início" };

export default async function DashboardPage() {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const month = format(new Date(), "yyyy-MM");

  const [allTransactions, bills, accounts, categories] = await Promise.all([
    repo.listTransactions(),
    repo.listBills(),
    repo.listAccounts(),
    repo.listCategories(),
  ]);

  const transactions = allTransactions.filter((t) => t.date.startsWith(month));
  const today = new Date();
  const forecast = buildCashFlowForecast({ accounts, transactions: allTransactions, bills, today });
  const evolution = monthlyEvolution(allTransactions, today);
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
    <div className="flex flex-col gap-6">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.25}>
          <Section title="Evolução mensal">
            <Panel>
              <MonthlyEvolutionChart data={evolution} />
            </Panel>
          </Section>
        </Reveal>
        <Reveal delay={0.3}>
          <Section title="Previsão de fluxo de caixa" href="/fluxo" linkLabel="Detalhes">
            <Panel>
              <CashFlowChart points={forecast.points} />
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Hoje</p>
                  <p className="font-semibold tabular-nums">{formatCents(forecast.startBalance)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Em 90 dias</p>
                  <p className="font-semibold tabular-nums">{formatCents(forecast.endBalance)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ponto mais baixo</p>
                  <p className="font-semibold tabular-nums">{formatCents(forecast.lowest.balance)}</p>
                </div>
              </div>
            </Panel>
          </Section>
        </Reveal>
      </div>
    </div>
  );
}
