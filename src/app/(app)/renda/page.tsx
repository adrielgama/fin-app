import { MonthNav } from "@/components/finance/month-nav";
import { IncomeManager } from "@/components/finance/income-manager";
import { Reveal } from "@/components/motion/reveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { incomeSummary } from "@/lib/analytics";
import { requireUser } from "@/lib/auth/session";
import { formatCents } from "@/lib/format";
import { resolveMonth } from "@/lib/month";
import { getRepository } from "@/lib/repository";

export const metadata = { title: "Renda" };

export default async function RendaPage({ searchParams }: PageProps<"/renda">) {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const month = resolveMonth((await searchParams).mes);

  const [entries, accounts] = await Promise.all([repo.listIncomeEntries({ month }), repo.listAccounts()]);
  const rows = entries.toSorted((a, b) => b.date.localeCompare(a.date));
  const s = incomeSummary(entries);

  const stats = [
    { label: "Líquido CLT", value: s.cltNet },
    { label: "Notas PJ (bruto)", value: s.pjGross },
    { label: "Impostos PJ", value: s.pjTaxes },
    { label: "Renda líquida total", value: s.totalNet },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Reveal className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Renda</h1>
        <MonthNav month={month} basePath="/renda" />
      </Reveal>
      <Reveal delay={0.06} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value }, i) => (
          <Card key={label} className={i === 3 ? "bg-linear-to-br from-hero-from to-hero-to text-white" : undefined}>
            <CardHeader>
              <CardTitle className={i === 3 ? "text-xs font-medium text-white/75" : "text-xs font-medium text-muted-foreground"}>
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-lg font-semibold tabular-nums">{formatCents(value)}</CardContent>
          </Card>
        ))}
      </Reveal>
      <Reveal delay={0.12} className="flex flex-col gap-4">
        <IncomeManager entries={rows} accounts={accounts} />
      </Reveal>
    </div>
  );
}
