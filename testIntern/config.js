define({
	//Test startTime param: seek at start
	testPage: [
		'http://tv-has.orange-labs.fr/hasplayer_orange/1.2.0_dev/player.html'
	],
	//Test Live stream play (playing after 10 seconds with buffering margin of 2 seconds)
	live: [
		'http://2is7server1.rd.francetelecom.com/C4/C4-46_S2.isml/Manifest',
		'http://2is7server1.rd.francetelecom.com/C4/C4-46_S1.isml/Manifest'
	],
	//Test DRM stream play (on IE only)
	DRM: [
		'http://playready.directtaps.net/smoothstreaming/SSWSS720H264PR/SuperSpeedway_720.ism/Manifest'
	],
	//Test Playing, Seek and Loop
	seek: [
		'http://2is7server1.rd.francetelecom.com/VOD/BBB-SD/big_buck_bunny_1080p_stereo.ism/Manifest',
		'http://2is7server1.rd.francetelecom.com/VOD/Volver/PIVOT VOLVER_PS_smooth.ism/Manifest',
		'http://161.105.176.12/VOD/Arte/C4-51_S1.ism/manifest'
	],
	//Test startTime param: seek at start
	startTime: [
		'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest#s=50'
	],
	//Test Multiaudio change from first track to the second one (for multiaudio videos only)
	//Params correspond to first and second audio tracks (regex that match the audio fragments url for)
	multiAudio: [
		['http://161.105.176.12/VOD/Arte/C4-51_S1.ism/manifest', 'audio101_fra', 'audio102_deu']
	]
});