angular.module('HASPlayer').service('graphService', function($resource){
	var chartService = $resource('/chart', {});

	return {
		getChart: function(requestData) {
			return chartService.save(requestData).$promise;
		}

		
	};
});