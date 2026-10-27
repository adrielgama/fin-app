import { MonthNav } from "@/components/finance/month-nav";
import { SpreadsheetView } from "@/components/finance/spreadsheet-view";
import { Reveal } from "@/components/motion/reveal";
import { requireUser } from "@/lib/auth/session";
import { resolveMonth } from "@/lib/month";
import { getRepository } from "@/lib/repository";
import { buildSheetRows } from "@/lib/spreadsheet";

export const metadata = { title: "Planilha" };

export default async function PlanilhaPage({ searchParams }: PageProps<"/planilha">) {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const month = resolveMonth((await searchParams).mes);

  const [transactions, categories, accounts] = await Promise.all([
    repo.listTransactions({ month }),
    repo.listCategories(),
    repo.listAccounts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Reveal className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Planilha</h1>
        <MonthNav month={month} basePath="/planilha" />
      </Reveal>
      <Reveal delay={0.08}>
        <SpreadsheetView
          key={month}
          rows={buildSheetRows(transactions, categories, accounts)}
          month={month}
          categories={categories.map((c) => c.name)}
          accounts={accounts.map((a) => a.name)}
        />
      </Reveal>
    </div>
  );
}
