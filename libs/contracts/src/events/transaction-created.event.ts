import type { EventEnvelope, TransactionType } from './envelope';

export const TRANSACTION_CREATED = 'transaction.created';

export interface TransactionCreatedPayload {
  transactionId: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  /** String representation of the Decimal amount, e.g. "1000.00". */
  amount: string;
  type: TransactionType;
  description: string | null;
  /** ISO-8601 date string, e.g. "2026-01-15". */
  transactionDate: string;
  /** ISO-8601 UTC timestamp. */
  createdAt: string;
}

export interface TransactionCreatedEvent extends EventEnvelope {
  payload: TransactionCreatedPayload;
}
