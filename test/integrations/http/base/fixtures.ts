export const TEST_USER = {
  id: '2e3aab5d-6a3c-4b88-9c25-5f48d8f3f0a1',
  email: 'user@example.com',
  // bcrypt hash of "password"
  passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  createdAt: new Date(),
};

export const TEST_CATEGORY = {
  id: '83a6f2e4-1f3b-4a95-8e62-fb7d3557d881',
  userId: TEST_USER.id,
  name: 'Salary',
  type: 'income' as const,
  createdAt: new Date(),
};

export const TEST_TRANSACTION = {
  id: 'd71c2773-52e7-40dc-954a-7b7c9368292f',
  userId: TEST_USER.id,
  categoryId: TEST_CATEGORY.id,
  amount: '1000.00',
  type: 'income' as const,
  description: 'Monthly salary',
  transactionDate: new Date('2026-01-15T00:00:00.000Z'),
  createdAt: new Date(),
  category: {
    id: TEST_CATEGORY.id,
    name: TEST_CATEGORY.name,
    type: TEST_CATEGORY.type,
  },
};
