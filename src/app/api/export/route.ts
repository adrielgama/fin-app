import ExcelJS from "exceljs";
import { format as formatDate, parseISO } from "date-fns";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveMonth } from "@/lib/month";
import { getRepository } from "@/lib/repository";
import { applyFilters, buildSheetRows, parseFilters, totals, type SheetRow } from "@/lib/spreadsheet";

const headers = ["Data", "Tipo", "Descrição", "Categoria", "Conta", "Pagamento", "Recorrência", "Valor (R$)", "Observações"];

const toCells = (r: SheetRow) => [
  parseISO(r.date),
  r.kind === "income" ? "Receita" : "Despesa",
  r.description,
  r.category,
  r.account,
  r.paymentMethod,
  r.recurrence,
  r.amount,
  r.notes,
];

function toCsv(rows: SheetRow[]): string {
  const escape = (v: string | number | Date) => {
    const text = v instanceof Date ? formatDate(v, "dd/MM/yyyy") : typeof v === "number" ? v.toFixed(2).replace(".", ",") : v;
    const formulaLike = typeof v === "string" && /^[=+\-@]/.test(text);
    return /[;"\n\r]/.test(text) || formulaLike ? `"${(formulaLike ? `'${text}` : text).replace(/"/g, '""')}"` : text;
  };
  const lines = [headers, ...rows.map(toCells)].map((cells) => cells.map(escape).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}

async function toXlsx(rows: SheetRow[], month: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Lançamentos ${month}`, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: headers[0], width: 12, style: { numFmt: "dd/mm/yyyy" } },
    { header: headers[1], width: 10 },
    { header: headers[2], width: 34 },
    { header: headers[3], width: 18 },
    { header: headers[4], width: 20 },
    { header: headers[5], width: 15 },
    { header: headers[6], width: 14 },
    { header: headers[7], width: 16, style: { numFmt: '"R$" #,##0.00;[Red]-"R$" #,##0.00' } },
    { header: headers[8], width: 30 },
  ];
  rows.forEach((r) => sheet.addRow(toCells(r)));

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D28D9" } };
  sheet.autoFilter = { from: "A1", to: `I${Math.max(rows.length + 1, 2)}` };

  const total = sheet.addRow(["", "", "", "", "", "", "Saldo", { formula: `SUM(H2:H${rows.length + 1})`, result: totals(rows).income - totals(rows).expense }]);
  total.font = { bold: true };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = resolveMonth(searchParams.get("mes") ?? undefined);
  const repo = getRepository(user.uid);
  const [transactions, categories, accounts] = await Promise.all([
    repo.listTransactions({ month }),
    repo.listCategories(),
    repo.listAccounts(),
  ]);
  const rows = applyFilters(buildSheetRows(transactions, categories, accounts), parseFilters(searchParams));

  if (searchParams.get("formato") === "csv") {
    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lancamentos-${month}.csv"`,
      },
    });
  }

  return new Response(new Uint8Array(await toXlsx(rows, month)), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="lancamentos-${month}.xlsx"`,
    },
  });
}
