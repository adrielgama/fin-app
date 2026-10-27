import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { buildEmailHtml, buildMessage, selectDueReminders, todayInTimeZone, type BillDoc, type DueReminder } from "./reminders";

initializeApp();

const TIME_ZONE = "America/Sao_Paulo";
const HORIZON_DAYS = 30;
const INVALID_TOKEN_CODES = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token"]);

interface UserDoc {
  email?: string;
  notifications?: { push?: boolean; email?: boolean };
  fcmTokens?: string[];
}

export const billReminders = onSchedule({ schedule: "every day 08:00", timeZone: TIME_ZONE, region: "southamerica-east1" }, async () => {
  const db = getFirestore();
  const today = todayInTimeZone(new Date(), TIME_ZONE);
  const horizon = todayInTimeZone(new Date(Date.now() + HORIZON_DAYS * 86_400_000), TIME_ZONE);

  const snapshot = await db.collectionGroup("bills").where("status", "==", "pending").where("dueDate", "<=", horizon).get();
  const bills = snapshot.docs.flatMap((doc) => {
    const uid = doc.ref.parent.parent?.id;
    return uid ? [{ id: doc.id, uid, data: doc.data() as BillDoc }] : [];
  });

  const byUser = new Map<string, DueReminder[]>();
  for (const reminder of selectDueReminders(bills, today)) {
    byUser.set(reminder.uid, [...(byUser.get(reminder.uid) ?? []), reminder]);
  }

  for (const [uid, reminders] of byUser) {
    const userRef = db.doc(`users/${uid}`);
    const user = (await userRef.get()).data() as UserDoc | undefined;
    if (!user) continue;

    const { title, body } = buildMessage(reminders);
    let delivered = false;

    const tokens = user.fcmTokens ?? [];
    if (user.notifications?.push !== false && tokens.length) {
      const result = await getMessaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        webpush: { fcmOptions: { link: "/contas" } },
      });
      delivered ||= result.successCount > 0;

      const stale = tokens.filter((_, i) => {
        const code = result.responses[i].error?.code;
        return code !== undefined && INVALID_TOKEN_CODES.has(code);
      });
      if (stale.length) await userRef.update({ fcmTokens: tokens.filter((t) => !stale.includes(t)) });
    }

    if (user.notifications?.email && user.email) {
      await db.collection("mail").add({ to: user.email, message: { subject: title, html: buildEmailHtml(reminders) } });
      delivered = true;
    }

    if (delivered) {
      const batch = db.batch();
      for (const r of reminders) batch.update(db.doc(`users/${uid}/bills/${r.billId}`), { lastReminderDate: today });
      await batch.commit();
    }
    logger.info("Lembretes enviados", { uid, count: reminders.length, delivered });
  }
});
