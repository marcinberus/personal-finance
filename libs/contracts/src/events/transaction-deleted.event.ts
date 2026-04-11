import type { EventEnvelope } from './envelope';

export const TRANSACTION_DELETED = 'transaction.deleted';

export interface TransactionDeletedPayload {
  transactionId: string;
  userId: string;
  /** ISO-8601 UTC timestamp of when the deletion occurred. */
  deletedAt: string;
}

export interface TransactionDeletedEvent extends EventEnvelope {
  payload: TransactionDeletedPayload;
}
