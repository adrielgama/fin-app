export interface BillDoc {
  title: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid";
  reminderDaysBefore: number[];
  lastReminderDate?: string | null;
}

export interface DueReminder {
  billId: string;
  uid: string;
  title: string;
  amount: number;
  dueDate: string;
  daysUntil: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS);
}

export function todayInTimeZone(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function selectDueReminders(
  bills: { id: string; uid: string; data: BillDoc }[],
  today: string,
): DueReminder[] {
  return bills.flatMap(({ id, uid, data }) => {
    if (data.status !== "pending" || data.lastReminderDate === today) return [];
    const daysUntil = daysBetween(today, data.dueDate);
    const overdueDaily = daysUntil < 0 && daysUntil >= -3;
    if (!overdueDaily && !data.reminderDaysBefore.includes(daysUntil)) return [];
    return [{ billId: id, uid, title: data.title, amount: data.amount, dueDate: data.dueDate, daysUntil }];
  });
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function describeDue(daysUntil: number): string {
  if (daysUntil < 0) return `venceu há ${-daysUntil} dia(s)`;
  if (daysUntil === 0) return "vence hoje";
  return daysUntil === 1 ? "vence amanhã" : `vence em ${daysUntil} dias`;
}

export function buildMessage(reminders: DueReminder[]): { title: string; body: string } {
  if (reminders.length === 1) {
    const r = reminders[0];
    return { title: `Conta a pagar: ${r.title}`, body: `${brl.format(r.amount / 100)} ${describeDue(r.daysUntil)}.` };
  }
  const total = reminders.reduce((sum, r) => sum + r.amount, 0);
  return {
    title: `${reminders.length} contas a pagar`,
    body: `${reminders.map((r) => `${r.title} (${describeDue(r.daysUntil)})`).join(", ")}. Total ${brl.format(total / 100)}.`,
  };
}

export function buildEmailHtml(reminders: DueReminder[]): string {
  const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
  const rows = reminders
    .map((r) => `<li><strong>${escape(r.title)}</strong> — ${brl.format(r.amount / 100)} (${describeDue(r.daysUntil)}, ${r.dueDate.split("-").reverse().join("/")})</li>`)
    .join("");
  return `<p>Suas contas a pagar:</p><ul>${rows}</ul>`;
}
