angular.module('HASPlayer').service('graphService', function($resource){
	var chartService = $resource('/chart-db', {});

	return {
		getChart: function(requestData) {
			return chartService.save(requestData).$promise;
		}

		
	};
});