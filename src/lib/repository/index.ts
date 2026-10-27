import "server-only";
import { isMockMode } from "@/lib/env";
import { createFirestoreRepository } from "./firestore";
import { createMockRepository } from "./mock";
import type { FinanceRepository } from "./types";

export function getRepository(uid: string): FinanceRepository {
  if (isMockMode) return createMockRepository();
  return createFirestoreRepository(uid);
}

export type { FinanceRepository } from "./types";
