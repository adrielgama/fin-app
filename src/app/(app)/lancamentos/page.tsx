import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/auth/session";
import { formatCents, formatDate } from "@/lib/format";
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
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const rows = transactions.toSorted((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Lançamentos</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{formatDate(t.date)}</TableCell>
              <TableCell>{t.description}</TableCell>
              <TableCell>
                <Badge variant="secondary">{categoryName.get(t.categoryId)}</Badge>
              </TableCell>
              <TableCell>{accountName.get(t.accountId)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {t.kind === "expense" ? "-" : ""}
                {formatCents(t.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
