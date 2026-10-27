"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CashFlowPoint, MonthlyPoint } from "@/lib/forecast";
import { formatCents } from "@/lib/format";

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const axisMoney = (cents: number) => compact.format(cents / 100);

const tooltipStyle = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

export function MonthlyEvolutionChart({ data }: { data: MonthlyPoint[] }) {
  const rows = data.map((d) => ({ ...d, label: format(parseISO(`${d.month}-01`), "MMM", { locale: ptBR }) }));

  return (
    <div className="h-64 w-full" role="img" aria-label="Evolução mensal de receitas e despesas">
      <ResponsiveContainer>
        <BarChart data={rows} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis tickFormatter={axisMoney} tickLine={false} axisLine={false} width={44} fontSize={12} stroke="var(--muted-foreground)" />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            contentStyle={tooltipStyle}
            formatter={(value, name) => [formatCents(Number(value)), name === "income" ? "Receitas" : "Despesas"]}
          />
          <Bar dataKey="income" fill="var(--success)" radius={[6, 6, 0, 0]} animationDuration={900} />
          <Bar dataKey="expense" fill="var(--chart-1)" radius={[6, 6, 0, 0]} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashFlowChart({ points }: { points: CashFlowPoint[] }) {
  const rows = points.map((p) => ({ ...p, label: format(parseISO(p.date), "dd/MM") }));

  return (
    <div className="h-64 w-full" role="img" aria-label="Previsão de saldo para os próximos 90 dias">
      <ResponsiveContainer>
        <AreaChart data={rows}>
          <defs>
            <linearGradient id="cashflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} minTickGap={32} stroke="var(--muted-foreground)" />
          <YAxis tickFormatter={axisMoney} tickLine={false} axisLine={false} width={44} fontSize={12} stroke="var(--muted-foreground)" />
          <ReferenceLine y={0} stroke="var(--destructive)" strokeDasharray="4 4" />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCents(Number(value)), "Saldo previsto"]} />
          <Area type="monotone" dataKey="balance" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#cashflow)" animationDuration={1000} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
