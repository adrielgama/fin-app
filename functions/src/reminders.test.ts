import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMessage, daysBetween, selectDueReminders, todayInTimeZone, type BillDoc } from "./reminders";

const bill = (over: Partial<BillDoc>): { id: string; uid: string; data: BillDoc } => ({
  id: "b1",
  uid: "u1",
  data: { title: "Aluguel", amount: 230000, dueDate: "2026-11-05", status: "pending", reminderDaysBefore: [3, 0], ...over },
});

test("daysBetween", () => {
  assert.equal(daysBetween("2026-11-02", "2026-11-05"), 3);
  assert.equal(daysBetween("2026-11-05", "2026-11-02"), -3);
});

test("todayInTimeZone respeita o fuso", () => {
  assert.equal(todayInTimeZone(new Date("2026-11-05T01:00:00Z"), "America/Sao_Paulo"), "2026-11-04");
});

test("seleciona apenas contas nos dias configurados", () => {
  assert.equal(selectDueReminders([bill({})], "2026-11-02").length, 1);
  assert.equal(selectDueReminders([bill({})], "2026-11-05").length, 1);
  assert.equal(selectDueReminders([bill({})], "2026-11-03").length, 0);
});

test("ignora pagas e já lembradas no dia", () => {
  assert.equal(selectDueReminders([bill({ status: "paid" })], "2026-11-05").length, 0);
  assert.equal(selectDueReminders([bill({ lastReminderDate: "2026-11-05" })], "2026-11-05").length, 0);
});

test("lembra vencidas por até 3 dias", () => {
  assert.equal(selectDueReminders([bill({})], "2026-11-07").length, 1);
  assert.equal(selectDueReminders([bill({})], "2026-11-09").length, 0);
});

test("mensagem agrupada", () => {
  const reminders = selectDueReminders([bill({}), { ...bill({ title: "Internet", amount: 12990 }), id: "b2" }], "2026-11-05");
  assert.match(buildMessage(reminders).title, /2 contas/);
});
