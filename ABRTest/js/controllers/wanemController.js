angular.module('HASPlayer').controller('WanemController', function($scope, $timeout, $q, fluxService) {

	fluxService.getSequence().then(function(sequence) {
		
		$scope.sequence = sequence;
		var lastAction = $scope.sequence.length,
		idx = 0;

		function qualityChange() {

			if(idx === lastAction) {
				return;
			}

			var action = $scope.sequence[idx];

			fluxService.setQuality(action.bandwidth).then(function() {
				action.valid = true;
				action.ongoing = true;
			}, function() {
				action.valid = false;
			});

			$timeout(function() {
				action.ongoing = false;
				idx++;
				qualityChange();
				
			}, action.duration);
		}

		qualityChange();

	});
});