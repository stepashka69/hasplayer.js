angular.module('HASPlayer').controller('UIController', function($scope,$location, $routeParams, $window, fluxService) {

	function empty(data) {
        return (data === undefined || data === '' || data === null);
    }

    fluxService.getList().then(function(data) {
        $scope.data.fluxList = data;
    }).then(function() {
        $scope.getParams();
    });

    var setFlux = function() {

        var i = 0,
        list = $scope.data.fluxList,
        len = list.length;

        for(i; i< len; i++) {
            if(list[i].link === $routeParams.url) {
                return list[i];
            }
        }

        return list[0];
    };

    

    //Version Choice
    fluxService.getVersion().then(function(data) {
        $scope.data.versionList = data;

        var i = 0,
        len = $scope.data.versionList.length;

        for(i; i<len; i++) {
            var pattern = new RegExp($scope.data.versionList[i].id);
            if(pattern.test($location.absUrl())) {
                $scope.selectedVersion = $scope.data.versionList[i].id;
            }
        }
    });

    $scope.initFlux = function() {
        console.log($scope.data.selectedItem.link);
        $location.search({url: $scope.data.selectedItem.link});
    };

    $scope.startFlux = function(selectedVersion) {
        $window.location.href = selectedVersion + '#' + $location.path();
    };

    $scope.getParams = function() {
        if (!empty($routeParams.url)) {
            var startPlayback = true;

            $scope.data.selectedItem = setFlux($scope.data.fluxList);
 
            if (!empty($routeParams.autoplay)) {
                startPlayback = ($routeParams.autoplay === 'true');
            }

            if (startPlayback) {
                $scope.action.load();
            }
        }
    };

});