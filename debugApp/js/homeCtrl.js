angular.module('HAS').controller('homeCtrl', ['$scope', '$location', function($scope, $location) {

	$scope.option = {};
	$scope.option.debug = false;

	$scope.call = {};

	$scope.call.debugToggle = function() {
		$scope.option.debug = !$scope.option.debug;
	};

	$scope.call.getPageLink = function(link) {
		var pageLink = '';
		
		if($scope.option.debug) {
			pageLink = '/index.html?file=';
		} else {
			pageLink = '/player.html?file=';
		}

		return pageLink + link;
	};

	$scope.data = {};

	$scope.data.fluxList = [{
		'name': 'Big Buck Bunny',
		'link': 'http://2is7server1.rd.francetelecom.com/VOD/BBB-SD/big_buck_bunny_1080p_stereo.ism/Manifest',
		'audioChoice': false,
		'live': false,
		'type': 'SMOOTH',
		'DRM': false
	}, {
		'name': 'France 2',
		'link': 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S2.isml/Manifest',
		'audioChoice': false,
		'live': true,
		'type': 'SMOOTH',
		'DRM': false
	}, {
		'name': 'SuperSpeedway',
		'link': 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264PR/SuperSpeedway_720.ism/Manifest',
		'audioChoice': false,
		'live': false,
		'type': 'SMOOTH',
		'DRM': true
	}, {
		'name': 'Arte',
		'link': 'http://161.105.176.12/VOD/Arte/C4-51_S1.ism/manifest',
		'audioChoice': true,
		'live': false,
		'type': 'SMOOTH',
		'DRM': false
	}];

}]);