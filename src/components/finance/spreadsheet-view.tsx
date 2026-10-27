"use client";

import { useMemo, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, DownloadIcon, SearchIcon } from "lucide-react";
import { selectClass } from "@/components/finance/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents, formatDate } from "@/lib/format";
import {
  applyFilters,
  defaultFilters,
  filtersToParams,
  totals,
  type SheetFilters,
  type SheetRow,
  type SortKey,
} from "@/lib/spreadsheet";
import { cn } from "@/lib/utils";

interface SpreadsheetViewProps {
  rows: SheetRow[];
  month: string;
  categories: string[];
  accounts: string[];
}

const columns: { key: SortKey; label: string; className?: string }[] = [
  { key: "date", label: "Data" },
  { key: "description", label: "Descrição" },
  { key: "category", label: "Categoria" },
  { key: "account", label: "Conta" },
  { key: "amount", label: "Valor", className: "text-right" },
];

const money = (reais: number) => formatCents(Math.round(reais * 100));

export function SpreadsheetView({ rows, month, categories, accounts }: SpreadsheetViewProps) {
  const [filters, setFilters] = useState<SheetFilters>(defaultFilters);
  const visible = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const sum = totals(visible);
  const exportQuery = filtersToParams(filters, month);

  const patch = (change: Partial<SheetFilters>) => setFilters((f) => ({ ...f, ...change }));
  const toggleSort = (key: SortKey) =>
    patch({ sort: key, dir: filters.sort === key && filters.dir === "desc" ? "asc" : "desc" });
  const exportHref = (formato: "xlsx" | "csv") => {
    const params = new URLSearchParams(exportQuery);
    params.set("formato", formato);
    return `/api/export?${params}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <SearchIcon className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Buscar descrição, categoria, conta..."
            className="h-9 pl-8"
            aria-label="Buscar"
          />
        </div>
        <select
          className={cn(selectClass, "w-auto")}
          value={filters.kind}
          onChange={(e) => patch({ kind: e.target.value as SheetFilters["kind"] })}
          aria-label="Tipo"
        >
          <option value="all">Todos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>
        <select className={cn(selectClass, "w-auto")} value={filters.category} onChange={(e) => patch({ category: e.target.value })} aria-label="Categoria">
          <option value="">Categorias</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className={cn(selectClass, "w-auto")} value={filters.account} onChange={(e) => patch({ account: e.target.value })} aria-label="Conta">
          <option value="">Contas</option>
          {accounts.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <a href={exportHref("xlsx")} className={buttonVariants({ variant: "default", size: "sm" })}>
          <DownloadIcon className="size-4" /> .xlsx
        </a>
        <a href={exportHref("csv")} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <DownloadIcon className="size-4" /> .csv
        </a>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-card p-2 shadow-soft ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => {
                const active = filters.sort === c.key;
                return (
                  <TableHead key={c.key} className={c.className} aria-sort={active ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}>
                    <Button variant="ghost" size="sm" className="-mx-2 gap-1" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      {active && (filters.dir === "asc" ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />)}
                    </Button>
                  </TableHead>
                );
              })}
              <TableHead>Pagamento</TableHead>
              <TableHead>Recorrência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
                <TableCell className="font-medium">{r.description}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell>{r.account}</TableCell>
                <TableCell className={cn("text-right tabular-nums", r.amount > 0 && "text-success")}>{money(r.amount)}</TableCell>
                <TableCell>{r.paymentMethod}</TableCell>
                <TableCell>{r.recurrence}</TableCell>
              </TableRow>
            ))}
            {!visible.length && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Nenhum lançamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="font-medium">
                {visible.length} lançamentos · receitas {money(sum.income)} · despesas {money(sum.expense)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{money(sum.income - sum.expense)}</TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
