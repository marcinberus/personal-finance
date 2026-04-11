import type { EventEnvelope, CategoryType } from './envelope';

export const CATEGORY_CREATED = 'category.created';

export interface CategoryCreatedPayload {
  categoryId: string;
  userId: string;
  name: string;
  type: CategoryType;
  /** ISO-8601 UTC timestamp. */
  createdAt: string;
}

export interface CategoryCreatedEvent extends EventEnvelope {
  payload: CategoryCreatedPayload;
}
