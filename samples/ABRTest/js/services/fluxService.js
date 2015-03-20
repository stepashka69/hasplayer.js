angular.module('HASPlayer').service('fluxService', function($resource, $http){

	var listService = $resource('js/data/flux-list.json', {}, {query: {method:'GET', isArray: true}}),
		sequenceService = $resource('js/data/scenario.json', {}, {}),
		versionService = $resource('js/data/version-list.json', {}, {});

	return {
		getList: function() {
			return listService.query().$promise;
		},

		getSequence: function() {
			return sequenceService.query().$promise;
		},

		getVersion: function() {
			return versionService.query().$promise;
		},

		setQuality: function(quality) {
			//limit should be defined in bytes
			var dataJson = {'NetBalancerLimit':{'upLimit':quality*125, 'activate':1 }};

			return $http({
	            url: 'http://localhost:8080/NetBalancerLimit',
	            method: "POST",
	            data: dataJson,
	            headers: {'Content-Type': 'application/json'}
	        });
		}

	};
});