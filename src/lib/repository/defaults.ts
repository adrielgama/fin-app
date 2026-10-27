import type { Category } from "@/lib/schemas";

export const defaultCategories: Category[] = [
  { id: "cat-moradia", name: "Moradia", kind: "expense", icon: "home", color: "#6366f1" },
  { id: "cat-mercado", name: "Mercado", kind: "expense", icon: "shopping-cart", color: "#10b981" },
  { id: "cat-transporte", name: "Transporte", kind: "expense", icon: "car", color: "#f59e0b" },
  { id: "cat-lazer", name: "Lazer", kind: "expense", icon: "clapperboard", color: "#ec4899" },
  { id: "cat-saude", name: "Saúde", kind: "expense", icon: "heart-pulse", color: "#ef4444" },
  { id: "cat-impostos", name: "Impostos", kind: "expense", icon: "landmark", color: "#64748b" },
  { id: "cat-assinaturas", name: "Assinaturas", kind: "expense", icon: "repeat", color: "#06b6d4" },
  { id: "cat-salario", name: "Salário", kind: "income", icon: "briefcase", color: "#059669" },
  { id: "cat-freela", name: "Notas PJ", kind: "income", icon: "file-text", color: "#0891b2" },
];
