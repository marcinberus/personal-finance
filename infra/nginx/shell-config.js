window.PF_SHELL_CONFIG = {
  topbar: {
    eyebrow: 'Distributed Finance',
    title: 'Personal Finance',
    note: 'Migration shell',
  },
  tabs: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '#/dashboard',
      path: '/dashboard',
      owner: 'legacy',
      authOnly: true,
    },
    {
      id: 'categories',
      label: 'Categories',
      href: '#/categories',
      path: '/categories',
      owner: 'legacy',
      authOnly: true,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      href: '#/transactions',
      path: '/transactions',
      owner: 'legacy',
      authOnly: true,
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '#/reports',
      path: '/reports',
      owner: 'legacy',
      authOnly: true,
    },
    {
      id: 'login',
      label: 'Login',
      href: '/login',
      path: '/login',
      owner: 'legacy',
      authOnly: false,
    },
  ],
};
