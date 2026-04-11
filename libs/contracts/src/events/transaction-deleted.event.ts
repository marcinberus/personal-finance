import type { EventEnvelope, TransactionType } from './envelope';

export const TRANSACTION_DELETED = 'transaction.deleted';

export interface TransactionDeletedPayload {
  transactionId: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  /** String representation of the Decimal amount, e.g. "1000.00". */
  amount: string;
  type: TransactionType;
  /** ISO-8601 date string, e.g. "2026-01-15". */
  transactionDate: string;
  /** ISO-8601 UTC timestamp of when the deletion occurred. */
  deletedAt: string;
}

export interface TransactionDeletedEvent extends EventEnvelope {
  payload: TransactionDeletedPayload;
}
