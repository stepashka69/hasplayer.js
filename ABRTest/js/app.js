'use strict';
var DEBUG = true;

var app = angular.module('HASPlayer', ['ngResource', 'highcharts-ng', 'ngRoute']);


app.config(['$routeProvider',
	function($routeProvider) {

		$routeProvider.
		when('/', {
			templateUrl: 'views/main.html',
			controller: 'MainController'
		}).
		otherwise({
			redirectTo: '/'
		});
	}]);

app.run(function($rootScope) {
	$rootScope.empty = function (data) {
		return (data === undefined || data === '' || data === null);
	};
});