'use strict';

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