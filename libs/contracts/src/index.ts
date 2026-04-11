export type {
  CategoryType,
  TransactionType,
  EventEnvelope,
} from './events/envelope';

export { TRANSACTION_CREATED } from './events/transaction-created.event';
export type {
  TransactionCreatedPayload,
  TransactionCreatedEvent,
} from './events/transaction-created.event';

export { TRANSACTION_DELETED } from './events/transaction-deleted.event';
export type {
  TransactionDeletedPayload,
  TransactionDeletedEvent,
} from './events/transaction-deleted.event';

export { CATEGORY_CREATED } from './events/category-created.event';
export type {
  CategoryCreatedPayload,
  CategoryCreatedEvent,
} from './events/category-created.event';

/** The RabbitMQ queue that ledger-service publishes to and reporting-service consumes from. */
export const LEDGER_EVENTS_QUEUE = 'ledger_events';
