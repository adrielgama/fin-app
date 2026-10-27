import { format } from "date-fns";
import { CardUsage } from "@/components/finance/card-usage";
import { Panel, Section } from "@/components/finance/section";
import { TransactionList } from "@/components/finance/transaction-list";
import { Reveal } from "@/components/motion/reveal";
import { cardSummaries } from "@/lib/analytics";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/repository";

export const metadata = { title: "Cartões" };

export default async function CartoesPage() {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const month = format(new Date(), "yyyy-MM");

  const [transactions, accounts, categories] = await Promise.all([
    repo.listTransactions({ month }),
    repo.listAccounts(),
    repo.listCategories(),
  ]);
  const cards = cardSummaries(accounts, transactions);

  return (
    <div className="flex flex-col gap-8">
      <Reveal>
        <h1 className="text-2xl font-semibold">Cartões</h1>
      </Reveal>
      {cards.map((card, i) => {
        const rows = transactions
          .filter((t) => t.accountId === card.account.id)
          .toSorted((a, b) => b.date.localeCompare(a.date));
        return (
          <Reveal key={card.account.id} delay={0.08 + i * 0.08}>
            <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
              <CardUsage summary={card} />
              <Section title="Compras na fatura">
                <Panel>
                  <TransactionList transactions={rows} categories={categories} accounts={accounts} />
                </Panel>
              </Section>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
