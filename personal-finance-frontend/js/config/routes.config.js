(function () {
  'use strict';

  angular.module('pfApp').config([
    '$routeProvider',
    '$locationProvider',
    function ($routeProvider, $locationProvider) {
      $locationProvider.hashPrefix('');

      $routeProvider
        .when('/login', {
          template: '',
          controller: [
            '$window',
            function ($window) {
              $window.location.replace('/login');
            },
          ],
        })
        .when('/register', {
          template: '',
          controller: [
            '$window',
            function ($window) {
              $window.location.replace('/register');
            },
          ],
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
