"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownLeftIcon, ArrowUpRightIcon, CreditCardIcon, EyeIcon, EyeOffIcon, PlusIcon } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { formatCents } from "@/lib/format";

interface BalanceHeroProps {
  name: string;
  balance: number;
  income: number;
  expense: number;
}

const actions = [
  { href: "/lancamentos", label: "Lançar", icon: PlusIcon },
  { href: "/lancamentos", label: "Receitas", icon: ArrowDownLeftIcon },
  { href: "/gastos", label: "Gastos", icon: ArrowUpRightIcon },
  { href: "/cartoes", label: "Cartões", icon: CreditCardIcon },
];

export function BalanceHero({ name, balance, income, expense }: BalanceHeroProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-hero-from via-hero-via to-hero-to p-6 text-white shadow-soft">
      <div className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="relative flex flex-col gap-6">
        <div>
          <p className="text-sm text-white/70">Olá, {name} 👋</p>
          <p className="mt-4 text-xs text-white/70">Saldo do mês</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              {hidden ? "R$ ••••••" : <CountUp cents={balance} />}
            </span>
            <button
              type="button"
              onClick={() => setHidden((v) => !v)}
              aria-label={hidden ? "Mostrar saldo" : "Ocultar saldo"}
              className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            >
              {hidden ? <EyeIcon className="size-5" /> : <EyeOffIcon className="size-5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/12 p-3 backdrop-blur">
            <span className="flex items-center gap-1.5 text-white/70">
              <ArrowDownLeftIcon className="size-3.5" /> Receitas
            </span>
            <p className="mt-1 font-semibold tabular-nums">{hidden ? "••••" : formatCents(income)}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-3 backdrop-blur">
            <span className="flex items-center gap-1.5 text-white/70">
              <ArrowUpRightIcon className="size-3.5" /> Despesas
            </span>
            <p className="mt-1 font-semibold tabular-nums">{hidden ? "••••" : formatCents(expense)}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {actions.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/12 py-3 text-xs font-medium transition-all hover:-translate-y-0.5 hover:bg-white/20 active:scale-95"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
