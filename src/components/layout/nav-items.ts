import { BriefcaseIcon, Table2Icon, CreditCardIcon, LayoutDashboardIcon, PieChartIcon, ReceiptTextIcon, type LucideIcon } from "lucide-react";

export const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Início", icon: LayoutDashboardIcon },
  { href: "/lancamentos", label: "Lançamentos", icon: ReceiptTextIcon },
  { href: "/renda", label: "Renda", icon: BriefcaseIcon },
  { href: "/cartoes", label: "Cartões", icon: CreditCardIcon },
  { href: "/planilha", label: "Planilha", icon: Table2Icon },
  { href: "/gastos", label: "Gastos", icon: PieChartIcon },
];
