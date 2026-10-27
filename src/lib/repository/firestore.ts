import "server-only";
import { addMonths, addWeeks, addYears, format, parseISO } from "date-fns";
import { FieldValue, type CollectionReference, type DocumentData } from "firebase-admin/firestore";
import type { z } from "zod";
import type { SessionUser } from "@/lib/auth/constants";
import { adminDb } from "@/lib/firebase/admin";
import {
  accountSchema,
  billSchema,
  categorySchema,
  incomeEntrySchema,
  transactionSchema,
  type Bill,
  type IncomeEntry,
  type Receipt,
  type Transaction,
} from "@/lib/schemas";
import { defaultCategories } from "./defaults";
import type { FinanceRepository, MonthFilter } from "./types";

const nowIso = () => new Date().toISOString();

function parseDoc<S extends z.ZodType>(schema: S, id: string, data: DocumentData): z.infer<S> {
  return schema.parse({ ...data, id });
}

export async function seedUserIfNeeded(user: SessionUser): Promise<void> {
  const db = adminDb();
  const userRef = db.doc(`users/${user.uid}`);
  if ((await userRef.get()).exists) return;

  const batch = db.batch();
  batch.set(userRef, {
    displayName: user.name,
    email: user.email,
    photoURL: user.photoURL,
    notifications: { push: true, email: false },
    fcmTokens: [],
  });
  for (const { id, ...category } of defaultCategories) batch.set(userRef.collection("categories").doc(id), category);
  batch.set(userRef.collection("accounts").doc("carteira"), {
    name: "Carteira",
    type: "cash",
    initialBalance: 0,
    color: "#7c3aed",
    archived: false,
    creditLimit: null,
    closingDay: null,
    dueDay: null,
    lastDigits: null,
  });
  await batch.commit();
}

export function createFirestoreRepository(uid: string): FinanceRepository {
  const db = adminDb();
  const userRef = db.doc(`users/${uid}`);
  const col = (name: string): CollectionReference => userRef.collection(name);

  async function listAll<S extends z.ZodType>(name: string, schema: S, month?: string): Promise<z.infer<S>[]> {
    const ref = month ? col(name).where("date", ">=", `${month}-01`).where("date", "<=", `${month}-31`) : col(name);
    const snapshot = await ref.get();
    return snapshot.docs.map((doc) => parseDoc(schema, doc.id, doc.data()));
  }

  const receiptCollection = (target: { kind: "transaction" | "bill" }) => col(target.kind === "transaction" ? "transactions" : "bills");

  return {
    listAccounts: () => listAll("accounts", accountSchema),
    createAccount: async (input) => {
      const ref = await col("accounts").add(input);
      return parseDoc(accountSchema, ref.id, input);
    },
    updateAccount: async (id, input) => {
      await col("accounts").doc(id).set(input);
      return parseDoc(accountSchema, id, input);
    },
    archiveAccount: async (id) => {
      await col("accounts").doc(id).update({ archived: true });
    },
    listCategories: () => listAll("categories", categorySchema),

    listTransactions: ({ month }: MonthFilter = {}) => listAll("transactions", transactionSchema, month),
    createTransaction: async (input) => {
      const data = { ...input, receipts: [], createdAt: nowIso() };
      const ref = await col("transactions").add(data);
      return parseDoc(transactionSchema, ref.id, data);
    },
    updateTransaction: async (id, input) => {
      const ref = col("transactions").doc(id);
      await ref.update({ ...input });
      return parseDoc(transactionSchema, id, (await ref.get()).data() ?? {});
    },
    deleteTransaction: async (id) => {
      await col("transactions").doc(id).delete();
    },

    listIncomeEntries: ({ month }: MonthFilter = {}) => listAll("incomeEntries", incomeEntrySchema, month),
    createIncomeEntry: async (input) => {
      const ref = await col("incomeEntries").add(input);
      return parseDoc(incomeEntrySchema, ref.id, input);
    },
    updateIncomeEntry: async (id, input) => {
      const ref = col("incomeEntries").doc(id);
      await ref.set(input);
      return parseDoc(incomeEntrySchema, id, input) as IncomeEntry;
    },
    deleteIncomeEntry: async (id) => {
      await col("incomeEntries").doc(id).delete();
    },

    listBills: () => listAll("bills", billSchema),
    createBill: async (input) => {
      const data = { ...input, status: "pending", paidAt: null, receipts: [], transactionId: null };
      const ref = await col("bills").add(data);
      return parseDoc(billSchema, ref.id, data);
    },
    updateBill: async (id, input) => {
      const ref = col("bills").doc(id);
      await ref.update({ ...input });
      return parseDoc(billSchema, id, (await ref.get()).data() ?? {});
    },
    deleteBill: async (id) => {
      await col("bills").doc(id).delete();
    },
    payBill: (id, paidAt) =>
      db.runTransaction(async (tx) => {
        const billRef = col("bills").doc(id);
        const snapshot = await tx.get(billRef);
        if (!snapshot.exists) throw new Error("Conta não encontrada");
        const bill: Bill = parseDoc(billSchema, id, snapshot.data() ?? {});
        if (bill.status === "paid") throw new Error("Conta já paga");

        const txRef = col("transactions").doc();
        const transaction: Omit<Transaction, "id"> = {
          kind: "expense",
          description: bill.title,
          amount: bill.amount,
          date: paidAt,
          categoryId: bill.categoryId,
          accountId: bill.accountId,
          paymentMethod: "boleto",
          recurrence: { frequency: "none" },
          receipts: bill.receipts,
          incomeEntryId: null,
          billId: id,
          notes: "",
          createdAt: nowIso(),
        };
        tx.set(txRef, transaction);
        tx.update(billRef, { status: "paid", paidAt, transactionId: txRef.id });

        if (bill.recurrence.frequency !== "none") {
          const step = { weekly: addWeeks, monthly: addMonths, yearly: addYears }[bill.recurrence.frequency];
          const dueDate = format(step(parseISO(bill.dueDate), bill.recurrence.interval), "yyyy-MM-dd");
          if (!bill.recurrence.endDate || dueDate <= bill.recurrence.endDate) {
            tx.set(col("bills").doc(), { ...billSchema.omit({ id: true }).parse(bill), dueDate, status: "pending", paidAt: null, receipts: [], transactionId: null });
          }
        }
        return { ...bill, status: "paid" as const, paidAt, transactionId: txRef.id };
      }),

    getNotificationSettings: async () => {
      const data = (await userRef.get()).data() ?? {};
      return {
        push: data.notifications?.push ?? true,
        email: data.notifications?.email ?? false,
        pushDevices: Array.isArray(data.fcmTokens) ? data.fcmTokens.length : 0,
      };
    },
    setNotificationPreferences: async ({ push, email }) => {
      await userRef.set({ notifications: { push, email } }, { merge: true });
    },
    addFcmToken: async (token) => {
      await userRef.set({ fcmTokens: FieldValue.arrayUnion(token) }, { merge: true });
    },

    addReceipt: async (target, meta) => {
      const receipt: Receipt = { ...meta, uploadedAt: nowIso() };
      await receiptCollection(target).doc(target.id).update({ receipts: FieldValue.arrayUnion(receipt) });
      return receipt;
    },
    removeReceipt: async (target, receiptId) => {
      const ref = receiptCollection(target).doc(target.id);
      return db.runTransaction(async (tx) => {
        const receipts: Receipt[] = (await tx.get(ref)).data()?.receipts ?? [];
        const receipt = receipts.find((r) => r.id === receiptId);
        if (!receipt) throw new Error("Comprovante não encontrado");
        tx.update(ref, { receipts: receipts.filter((r) => r.id !== receiptId) });
        return receipt;
      });
    },
  };
}
