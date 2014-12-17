'use strict';

var app = angular.module('HASPlayer', ['ngResource', 'highcharts-ng', 'ngRoute']);

app.run(function($rootScope) {
	$rootScope.empty = function (data) {
		return (data === undefined || data === '' || data === null);
	};
});