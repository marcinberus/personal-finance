export const TEST_USER = {
  id: '2e3aab5d-6a3c-4b88-9c25-5f48d8f3f0a1',
  email: 'user@example.com',
};

// Monthly Report DTOs (what the API returns)
export const TEST_MONTHLY_REPORT_APRIL = {
  year: 2026,
  month: 4,
  incomeTotal: '5000.00',
  expenseTotal: '2500.00',
  balance: '2500.00',
};

export const TEST_MONTHLY_REPORT_MAY = {
  year: 2026,
  month: 5,
  incomeTotal: '5500.00',
  expenseTotal: '2800.00',
  balance: '2700.00',
};

export const TEST_MONTHLY_REPORT_YTD = {
  year: 2026,
  month: null,
  incomeTotal: '10500.00',
  expenseTotal: '5300.00',
  balance: '5200.00',
};

// Category Spend DTOs (what the API returns)
export const TEST_CATEGORY_SPEND_GROCERIES = {
  categoryId: 'category-groceries',
  categoryName: 'Groceries',
  total: '500.00',
};

export const TEST_CATEGORY_SPEND_UTILITIES = {
  categoryId: 'category-utilities',
  categoryName: 'Utilities',
  total: '150.00',
};
