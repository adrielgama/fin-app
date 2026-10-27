const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export const formatCents = (cents: number) => brl.format(cents / 100);
export const formatDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`));
