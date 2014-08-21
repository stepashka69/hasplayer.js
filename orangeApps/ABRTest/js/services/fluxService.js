angular.module('HASPlayer').service('fluxService', function($resource){

	var listService = $resource('js/data/flux-list.json', {}, {query: {method:'GET', isArray: true}}),
		sequenceService = $resource('js/data/scenario.json', {}, {}),
		versionService = $resource('js/data/version-list.json', {}, {}),
		wanemAPI = $resource('http://192.168.1.2/TC/index.php?bw=:quality', {quality: '@quality'});

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
			return wanemAPI.get({quality: quality}).$promise;
		}

	};
});