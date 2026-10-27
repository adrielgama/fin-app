import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { formatCents, formatDate } from "@/lib/format";
import { getRepository } from "@/lib/repository";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const repo = getRepository(user.uid);
  const month = format(new Date(), "yyyy-MM");

  const [transactions, bills] = await Promise.all([repo.listTransactions({ month }), repo.listBills()]);

  const income = transactions.filter((t) => t.kind === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter((t) => t.kind === "expense").reduce((sum, t) => sum + t.amount, 0);
  const upcoming = bills
    .filter((b) => b.status === "pending")
    .toSorted((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const stats = [
    { label: "Receitas", value: income },
    { label: "Despesas", value: expense },
    { label: "Saldo do mês", value: income - expense },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Olá, {user.name.split(" ")[0]}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">{formatCents(value)}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Próximos vencimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm">
            {upcoming.map((bill) => (
              <li key={bill.id} className="flex justify-between gap-4">
                <span>
                  {bill.title} <span className="text-muted-foreground">· {formatDate(bill.dueDate)}</span>
                </span>
                <span className="tabular-nums">{formatCents(bill.amount)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
