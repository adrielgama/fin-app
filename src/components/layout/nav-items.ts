import { CreditCardIcon, LayoutDashboardIcon, PieChartIcon, ReceiptTextIcon, type LucideIcon } from "lucide-react";

export const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Início", icon: LayoutDashboardIcon },
  { href: "/lancamentos", label: "Lançamentos", icon: ReceiptTextIcon },
  { href: "/cartoes", label: "Cartões", icon: CreditCardIcon },
  { href: "/gastos", label: "Gastos", icon: PieChartIcon },
];
