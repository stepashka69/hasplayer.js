angular.module('HASPlayer').directive('chart', function(){
	return {
		scope: {},
		restrict: 'E',
		templateUrl: 'js/directives/chart-template.html',
		controller: function($scope, $timeout) {

			$scope.datas = [];

			localStorage.setItem('player1', "{}");
			localStorage.setItem('player2', "{}");
			
			var monitoring = function() {
				$timeout(function() {
					$scope.datas[0] = JSON.parse(localStorage.getItem('player1'));
					$scope.datas[1] = JSON.parse(localStorage.getItem('player2'));
					monitoring();
				}, 1000);
			};

			monitoring();

			$scope.$watch('datas', function(datas) {

				if(datas && datas.length > 1 && datas[0].playSeries && datas[0].playSeries[0] !== undefined && datas[1].playSeries[0] !== undefined) {
					//config du graph
					$scope.chartConfig = {
						title: {
							text: 'Comparing bandwidth of HASPlayer with and without Bytesrange'
						},
						xAxis: {
							min: datas[0].playSeries[0][0]
						},
						series: [{
							type: 'line',
							name: 'Bytesrange ON',
							color: 'red',
							data: datas[0].calcBandwidthSeries,
							marker: {
								radius: 2.5,
								symbol: 'triangle'
							}
						},
						{
							type: 'line',
							name: 'Bytesrange OFF',
							color: 'blue',
							data: datas[1].calcBandwidthSeries,
							marker: {
								radius: 2.5,
								symbol: 'triangle'
							}
						}]
					};
				} 
			}, true);

}
};
});