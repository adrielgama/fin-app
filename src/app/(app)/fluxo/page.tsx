import { CashFlowChart } from "@/components/finance/charts";
import { Panel, Section } from "@/components/finance/section";
import { Reveal } from "@/components/motion/reveal";
import { requireUser } from "@/lib/auth/session";
import { buildCashFlowForecast } from "@/lib/forecast";
import { formatCents, formatDate } from "@/lib/format";
import { getRepository } from "@/lib/repository";
import { cn } from "@/lib/utils";

export const metadata = { title: "Fluxo de caixa" };

export default async function FluxoPage() {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const [accounts, transactions, bills] = await Promise.all([
    repo.listAccounts(),
    repo.listTransactions(),
    repo.listBills(),
  ]);
  const forecast = buildCashFlowForecast({ accounts, transactions, bills, today: new Date() });

  const stats = [
    { label: "Saldo hoje", value: forecast.startBalance },
    { label: "Saldo em 90 dias", value: forecast.endBalance },
    { label: `Mínimo (${formatDate(forecast.lowest.date)})`, value: forecast.lowest.balance },
    { label: "Gasto variável estimado/dia", value: Math.round(forecast.variableDaily) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <h1 className="text-2xl font-semibold">Fluxo de caixa</h1>
        <p className="text-sm text-muted-foreground">
          Receitas e despesas recorrentes, contas a pagar e média de gastos variáveis dos últimos 3 meses.
        </p>
      </Reveal>

      <Reveal delay={0.06} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-card p-4 shadow-soft ring-1 ring-foreground/5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("mt-1 text-lg font-semibold tabular-nums", value < 0 && "text-destructive")}>{formatCents(value)}</p>
          </div>
        ))}
      </Reveal>

      <Reveal delay={0.12}>
        <Panel>
          <CashFlowChart points={forecast.points} />
        </Panel>
      </Reveal>

      <Reveal delay={0.18}>
        <Section title="Próximos eventos">
          <Panel>
            <ul className="flex flex-col">
              {forecast.events.slice(0, 20).map((e, i) => (
                <li key={`${e.date}-${e.label}-${i}`} className="flex items-center justify-between rounded-2xl p-2.5 text-sm hover:bg-muted/60">
                  <span className="font-medium">
                    {e.label}
                    <span className="block text-xs font-normal text-muted-foreground">{formatDate(e.date)}</span>
                  </span>
                  <span className={cn("font-semibold tabular-nums", e.amount > 0 && "text-success")}>
                    {e.amount > 0 ? "+" : "-"}
                    {formatCents(Math.abs(e.amount))}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </Section>
      </Reveal>
    </div>
  );
}
