import { TransactionRollbackError } from "drizzle-orm";
import { db, type Db } from "../lib/db";

// Runs fn inside a transaction that is always rolled back, so tests share one
// database without seeing each other's rows.
export async function withRollback(fn: (db: Db) => Promise<void>) {
  try {
    await db.transaction(async (tx) => {
      await fn(tx);
      tx.rollback();
    });
  } catch (error) {
    if (!(error instanceof TransactionRollbackError)) {
      throw error;
    }
  }
}
