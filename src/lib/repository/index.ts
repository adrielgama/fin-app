import "server-only";
import { isMockMode } from "@/lib/env";
import { createMockRepository } from "./mock";
import type { FinanceRepository } from "./types";

export function getRepository(uid: string): FinanceRepository {
  if (isMockMode) return createMockRepository();
  throw new Error(`Repositório Firestore ainda não implementado (uid: ${uid}).`);
}

export type { FinanceRepository } from "./types";
