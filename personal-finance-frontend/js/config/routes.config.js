(function () {
  'use strict';

  angular.module('pfApp').config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider
        .when('/login', {
          templateUrl: 'templates/auth/login.page.html',
          controller: 'LoginPageController',
          controllerAs: 'vm',
        })
        .when('/register', {
          templateUrl: 'templates/auth/register.page.html',
          controller: 'RegisterPageController',
          controllerAs: 'vm',
        })
        .when('/dashboard', {
          templateUrl: 'templates/dashboard/dashboard.page.html',
          controller: 'DashboardPageController',
          controllerAs: 'vm',
          requiresAuth: true,
        })
        .when('/categories', {
          templateUrl: 'templates/categories/categories.page.html',
          controller: 'CategoriesPageController',
          controllerAs: 'vm',
          requiresAuth: true,
        })
        .when('/transactions', {
          templateUrl: 'templates/transactions/transactions.page.html',
          controller: 'TransactionsPageController',
          controllerAs: 'vm',
          requiresAuth: true,
        })
        .when('/reports', {
          templateUrl: 'templates/reports/reports.page.html',
          controller: 'ReportsPageController',
          controllerAs: 'vm',
          requiresAuth: true,
        })
        .otherwise({ redirectTo: '/login' });
    },
  ]);
})();
