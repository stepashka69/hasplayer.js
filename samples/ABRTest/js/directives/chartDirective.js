angular.module('HASPlayer').directive('chart', function(){
	return {
		scope: {
			bandwidth: '='
		},
		restrict: 'E',
		templateUrl: 'js/directives/chart-template.html',
		controller: function($scope, $timeout, graphService, fluxService) {

			$scope.showBandwidth = true;

			$scope.getChart = function() {
				$scope.success = false;
				$scope.exportOngoing = true;
				graphService.getChart($scope.bandwidth).then(function(data) {

					$scope.dbId = data.id;
					$scope.success = true;
					$scope.exportOngoing = false;
				}, function() {
					$scope.exportOngoing = false;
				});
			};


			var data = {};
			$scope.started = false;

			$scope.bandwidth.dataSequence = [];

			fluxService.getSequence().then(function(sequence) {
				data.sequence = sequence;
			});

			$scope.$watch('bandwidth', function(bandwidth) {

				if(!$scope.started && bandwidth.playSeries[0] !== undefined) {

					//génération des données de la représentation de la séquence Wanem
					var i = 0,
					len = data.sequence.length,
					time = bandwidth.playSeries[0][0];

					for(i; i<len; i++) {

						$scope.bandwidth.dataSequence.push([time, data.sequence[i].bandwidth]);
						var datatime = time+(data.sequence[i].duration/1000);
						$scope.bandwidth.dataSequence.push([datatime - 0.001, data.sequence[i].bandwidth]);

						time = datatime;
					}

					data.sequenceGraph = [];
					angular.copy($scope.bandwidth.dataSequence, data.sequenceGraph);

					//config du graph
					$scope.chartConfig = {
						title: {
							text: 'ABR'
						},
						xAxis: {
							min: $scope.bandwidth.playSeries[0][0]
						},
						series: [{
							type: 'area',
							name: 'Scenario',
							color: '#16a085',
							data: data.sequenceGraph,
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
							name: 'Requests',
							color: '#2c3e50',
							data: $scope.bandwidth.requestSeries,
							marker: {
								radius: 2.5,
								symbol: 'circle'
							}
						},
						{
							type: 'line',
							name: 'Calculated Bandwidth',
							color: 'red',
							data: $scope.bandwidth.calcBandwidthSeries,
							marker: {
								radius: 2.5,
								symbol: 'triangle'
							}
						}]
					};

					$scope.started = true;
				} 
			}, true);

}
};
});