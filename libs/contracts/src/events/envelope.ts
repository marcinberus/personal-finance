export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense';

export interface EventEnvelope {
  /** Unique identifier for this specific event instance (UUID v4). */
  eventId: string;
  /** ISO-8601 UTC timestamp of when the event occurred. */
  occurredAt: string;
  /**
   * Optional correlation ID propagated from the originating request.
   * Useful for tracing a chain of operations across services.
   */
  correlationId?: string;
}
