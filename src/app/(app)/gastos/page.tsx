import { format } from "date-fns";
import { Panel } from "@/components/finance/section";
import { SpendingDonut } from "@/components/finance/spending-donut";
import { Reveal } from "@/components/motion/reveal";
import { categoryBreakdown, sumBy } from "@/lib/analytics";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/repository";

export const metadata = { title: "Gastos" };

export default async function GastosPage() {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const month = format(new Date(), "yyyy-MM");

  const [transactions, categories] = await Promise.all([repo.listTransactions({ month }), repo.listCategories()]);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Reveal>
        <h1 className="text-2xl font-semibold">Gastos</h1>
      </Reveal>
      <Reveal delay={0.08}>
        <Panel>
          <SpendingDonut slices={categoryBreakdown(transactions, categories)} total={sumBy(transactions, "expense")} />
        </Panel>
      </Reveal>
    </div>
  );
}
