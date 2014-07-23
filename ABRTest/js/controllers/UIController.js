angular.module('HASPlayer').controller('UIController', function($scope, $location, $routeParams, $window, $q, fluxService) {

	var getVersion = function() {

		var d = $q.defer(),
			version;

		fluxService.getVersion().then(function(data) {
			$scope.data.versionList = data;

			var i = 0,
			len = $scope.data.versionList.length;

			for(i; i<len; i++) {
				if(parseInt($routeParams.version) === $scope.data.versionList[i].id) {
					version = $scope.data.versionList[i];
				}
			}
			//si non spécifiée || non trouvée, version par défaut: première de la liste
			if($scope.empty(version)) {
				version = $scope.data.versionList[0];
			}

			d.resolve(version);

		});

		return d.promise;
	};

	$scope.updateUrl = function(stream) {

		if(stream !== undefined) {
			$scope.data.selectedItem = angular.copy(stream);
		} else {
			var i = 0,
			list = $scope.data.fluxList,
			len = list.length,
			updatedUrl = $scope.data.selectedItem.link;

			for(i; i<len; i++) {
				if(list[i].link !== updatedUrl) {
					$scope.data.stream = null;
				} else {
					$scope.data.stream = list[i];
					return;
				}
			}
		}

	};

	$scope.getUrl = function() {

		if (!$scope.empty($routeParams.url)) {
			var startPlayback = true;

			$scope.data.selectedItem.link = $routeParams.url;
			$scope.updateUrl();

			if (!$scope.empty($routeParams.autoplay)) {
				startPlayback = ($routeParams.autoplay === 'true');
			}

			if (startPlayback) {
				$scope.action.load();
			}
		}

	};

	$scope.startFlux = function() {
		$location.search({url: $scope.data.selectedItem.link, version: $scope.data.selectedVersion.id});
	};

	fluxService.getList().then(function(data) {

		$scope.data.fluxList = data;

		getVersion().then(function(version) {
			$scope.data.selectedVersion = version;
			$scope.getUrl();
		});
	});


	//UI Test
	
	$scope.noValidUrl = function() {
		return ($scope.empty($scope.data.selectedItem) || $scope.empty($scope.data.selectedItem.link));
	};

	$scope.noValidStream = function() {
		return $scope.empty($scope.data.stream);
	};

});