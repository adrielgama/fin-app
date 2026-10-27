import { readFileSync } from "node:fs";
import { after, before, describe, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

let env: RulesTestEnvironment;

const tx = { kind: "expense", amount: 1000, date: "2026-10-27", categoryId: "c", accountId: "a", paymentMethod: "pix" };

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-fin-app",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: readFileSync("storage.rules", "utf8"), host: "127.0.0.1", port: 9199 },
  });
});

after(async () => env.cleanup());

describe("firestore.rules", () => {
  test("dono lê e grava seus lançamentos", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertSucceeds(setDoc(doc(db, "users/alice/transactions/t1"), tx));
    await assertSucceeds(getDoc(doc(db, "users/alice/transactions/t1")));
    await assertSucceeds(deleteDoc(doc(db, "users/alice/transactions/t1")));
  });

  test("outro usuário e anônimo são bloqueados", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), "users/alice/transactions/t2"), tx));
    await assertFails(getDoc(doc(env.authenticatedContext("bob").firestore(), "users/alice/transactions/t2")));
    await assertFails(setDoc(doc(env.authenticatedContext("bob").firestore(), "users/alice/transactions/t3"), tx));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "users/alice/transactions/t2")));
  });

  test("valida valor, tipo e data do lançamento", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "users/alice/transactions/x"), { ...tx, amount: -5 }));
    await assertFails(setDoc(doc(db, "users/alice/transactions/x"), { ...tx, amount: 10.5 }));
    await assertFails(setDoc(doc(db, "users/alice/transactions/x"), { ...tx, kind: "other" }));
    await assertFails(setDoc(doc(db, "users/alice/transactions/x"), { ...tx, date: "27/10/2026" }));
  });

  test("renda: descontos não podem exceder o bruto", async () => {
    const db = env.authenticatedContext("alice").firestore();
    const entry = { source: "pj", kind: "invoice", grossAmount: 1000, deductions: 100, date: "2026-10-01" };
    await assertSucceeds(setDoc(doc(db, "users/alice/incomeEntries/i1"), entry));
    await assertFails(setDoc(doc(db, "users/alice/incomeEntries/i2"), { ...entry, deductions: 2000 }));
  });

  test("coleções desconhecidas e documento de usuário não podem ser removidos", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "mail/m1"), { to: "x@y.z" }));
    await assertFails(deleteDoc(doc(db, "users/alice")));
  });
});

describe("storage.rules", () => {
  const pdf = new Uint8Array([37, 80, 68, 70]);

  test("dono envia PDF/imagem; outros não", async () => {
    const alice = env.authenticatedContext("alice").storage();
    await assertSucceeds(uploadBytes(ref(alice, "users/alice/receipts/a.pdf"), pdf, { contentType: "application/pdf" }));
    await assertFails(uploadBytes(ref(env.authenticatedContext("bob").storage(), "users/alice/receipts/b.pdf"), pdf, { contentType: "application/pdf" }));
  });

  test("rejeita tipo inválido e arquivo grande", async () => {
    const alice = env.authenticatedContext("alice").storage();
    await assertFails(uploadBytes(ref(alice, "users/alice/receipts/c.exe"), pdf, { contentType: "application/x-msdownload" }));
    await assertFails(uploadBytes(ref(alice, "users/alice/receipts/big.pdf"), new Uint8Array(11 * 1024 * 1024), { contentType: "application/pdf" }));
  });
});
