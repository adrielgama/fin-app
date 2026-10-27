import {
  BriefcaseIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  PieChartIcon,
  ReceiptTextIcon,
  Table2Icon,
  TrendingUpIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Início", icon: LayoutDashboardIcon, primary: true },
  { href: "/lancamentos", label: "Lançamentos", icon: ReceiptTextIcon, primary: true },
  { href: "/contas", label: "Contas", icon: WalletIcon, primary: true },
  { href: "/cartoes", label: "Cartões", icon: CreditCardIcon, primary: true },
  { href: "/renda", label: "Renda", icon: BriefcaseIcon },
  { href: "/gastos", label: "Gastos", icon: PieChartIcon },
  { href: "/fluxo", label: "Fluxo", icon: TrendingUpIcon },
  { href: "/planilha", label: "Planilha", icon: Table2Icon },
];
