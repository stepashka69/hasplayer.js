angular.module('metricsViewer', []).controller('metricsController', function($scope) {
    $scope.sessionId = null;
	$scope.url = null;
	$scope.currentBandwidth = null;
	$scope.fps = null;
	$scope.msgNumber = 0;
	$scope.playerId = null;
	$scope.currentPlayerState = "Unknown";
	$scope.previousPlayerState = "Unknown";
});