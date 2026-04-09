export const TEST_USER = {
  id: 'user-id',
  email: 'user@example.com',
  // bcrypt hash of "password"
  passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  createdAt: new Date(),
};

export const TEST_CATEGORY = {
  id: 'category-id',
  userId: TEST_USER.id,
  name: 'Salary',
  type: 'income' as const,
  createdAt: new Date(),
};
