angular.module('HASPlayer').directive('chart', function(){
	return {
		scope: {
			bandwidth: '='
		},
		restrict: 'E',
		templateUrl: 'js/directives/chart-template.html',
		controller: function($scope, $timeout, graphService) {

			$scope.getChart = function() {
				$scope.success = false;
				$scope.exportOngoing = true;
				graphService.getChart($scope.bandwidth).then(function() {
					$scope.success = true;
					$scope.exportOngoing = false;
				}, function() {
					$scope.exportOngoing = false;
				});
			};

			$scope.$watch('bandwidth', function(bandwidth) {

				if(bandwidth.playSeries[0] !== undefined) {
					$scope.chartConfig = {
						title: {
							text: 'ABR'
						},
						xAxis: {
							min: $scope.bandwidth.playSeries[0][0]
						},
						series: [{
							type: 'area',
							name: 'Playing',
							color: '#16a085',
							data: $scope.bandwidth.playSeries,
							marker: {
								enabled: false
							},
							states: {
								hover: {
									lineWidth: 0
								}
							},
							enableMouseTracking: false
						}, {
							type: 'scatter',
							name: 'Calls',
							color: '#2c3e50',
							data: $scope.bandwidth.requestSeries,
							marker: {
								radius: 2.5,
								symbol: 'circle'
							}
						}]
					};
				} 
			}, true);

}
};
});