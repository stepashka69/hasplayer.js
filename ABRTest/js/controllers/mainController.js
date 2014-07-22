angular.module('HASPlayer').controller('MainController', function($scope, $timeout) {

    $scope.data = {};
    $scope.action = {};
    $scope.bandwidthData = {};

    $scope.data.player = null;
    $scope.action.updating = null;
   
    $scope.action.load = function () {

        $scope.playing = false;
        var versionFile = document.createElement('script');
        versionFile.setAttribute('type','text/javascript');
        versionFile.setAttribute('src', $scope.data.selectedVersion.file);

        document.head.appendChild(versionFile);

        versionFile.onload = function () {
            $timeout(function() {
                $scope.playing = true;
            }, 1);
        }; 
        
    };

});