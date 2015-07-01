angular.module('metricsViewer', ['luegg.directives']).controller('metricsController', function($scope) {
	$scope.playerId = null;
	$scope.sessionId = null;
	$scope.url = null;
	$scope.fullScreen = false;
	$scope.mediaType = null;
	$scope.metrics = [];
	$scope.encodingFormat = null;
	$scope.encapsulation = null;
	$scope.contentDuration = null;
	$scope.startupTime = null;
	$scope.firstMetricTime = null;

	$scope.resetMetrics = function() {
		$scope.playerId = null;
		$scope.sessionId = null;
		$scope.url = null;
		$scope.fullScreen = false;
		$scope.mediaType = null;
		$scope.metrics = [];
		$scope.encodingFormat = null;
		$scope.encapsulation = null;
		$scope.contentDuration = null;
		$scope.startupTime = null;
		$scope.firstMetricTime = null;
  	};
});