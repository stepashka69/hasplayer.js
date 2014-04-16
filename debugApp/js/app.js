angular.module('HAS', []);

angular.module('HAS').config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', {templateUrl: '/debug/views/home.html', controller: 'homeCtrl'});
}]);