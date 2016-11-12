angular.module('AlchemyData').config(function ($routeProvider) {
    $routeProvider
        .when('/news/:id', {
            templateUrl: './app_client/partials/news/detail.html',
            controller: 'DetailController'
        });
});
