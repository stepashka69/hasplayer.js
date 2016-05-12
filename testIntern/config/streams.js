define({

    MSS_LIVE_1: {
        "name": "France 2",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://2is7server1.rd.francetelecom.com/C4/C4-46_S2.isml/Manifest",
        "videoBitrates": [226000, 416000, 680000, 1200000, 2100000],
        "audioTracks": [{lang:'qad', id:'audio102_qad'}, {lang:'fra', id:'audio101_fra'}],
        "video_fragment_pattern":"(video)",
        "audio_fragment_pattern":"(audio)",
        "defaultAudioLang": 'qad'
    },
    MSS_LIVE_2: {
        "name": "BFMTV",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://2is7server1.rd.francetelecom.com/C4/C4-46_S1.isml/Manifest",
        "video_fragment_pattern":"(video)",
        "audio_fragment_pattern":"(audio)"
    },
    MSS_LIVE_MULTI_AUDIO: {
        "name": "Arte (multi-audio)",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://2is7server1.rd.francetelecom.com/C4/C4-50_TVApp2.isml/Manifest",
        "audioTracks": [{lang:'fra', id:'audio101_fra'}, {lang:'deu', id:'audio102_deu'}],
        "defaultAudioLang": 'deu'
    },
    MSS_LIVE_SUBT_1: {
        "name": "France 2 (subtitles)",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://2is7server1.rd.francetelecom.com/C4/C4-41_S2.isml/Manifest"
    },
    MSS_LIVE_SUBT_2: {
        "name": "Arte (subtitles)",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://2is7server1.rd.francetelecom.com/C4/C4-50_TVApp2.isml/Manifest",
        "subtitleTracks": [{lang:'fra', id:'301_fra'}]
    },
    MSS_LIVE_DVR: {
        "name": "BFMTV (DVR)",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://2is7server1.rd.francetelecom.com/C4/C4-50_TVApp1.isml/Manifest"
    },
    MSS_LIVE_DRM_1: {
        "name": "TF1-DRM",
        "protocol": "MSS",
        "type":"Live",
        "tvmUrl": "http://{platform_url}/live-webapp/v2/PC/channels/192/url"
    },
    MSS_LIVE_DRM_2: {
        "name": "M6-DRM",
        "protocol": "MSS",
        "type":"Live",
        "tvmUrl": "http://{platform_url}/live-webapp/v2/PC/channels/118/url"
    },
    MSS_VOD_1: {
        "name": "Big Buck Bunny",
        "protocol": "MSS",
        "type": "VOD",
        "url": "http://2is7server1.rd.francetelecom.com/VOD/BBB-SD/big_buck_bunny_1080p_stereo.ism/Manifest",
        "videoBitrates": [320000,680000,1100000,1600000,2100000],
        "duration": 596.4583334
    },
    MSS_VOD_2: {
        "name": "SuperSpeedway",
        "protocol": "MSS",
        "type": "VOD",
        "url": "http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest"
    },
    MSS_VOD_3: {
        "name": "Volver",
        "protocol": "MSS",
        "type": "VOD",
        "url": "http://2is7server1.rd.francetelecom.com/VOD/xBox/PIVOT%20VOLVER_PS-output.ism/Manifest"
    },
    MSS_VOD_4:{
        "name": "Arte",
        "protocol": "MSS",
        "type": "VOD",
        "url": "http://161.105.176.12/VOD/Arte/C4-51_S1.ism/manifest",
        "subtitleTracks": [{lang:'fra', id:'textstream_fra'}, {lang:'fre', id:'textstream_fre'}],
        "defaultSubtitleLang": 'fra'
    },
    MSS_VOD_MULTI_AUDIO: {
        "name": "Arte (multi-audio)",
        "protocol": "MSS",
        "type": "VOD",
        "url": "http://161.105.176.12/VOD/Arte/C4-51_S1.ism/manifest"
    },
    MSS_LIVE_MANIFEST_ERROR: {
        "name": "France 2 (Manifest error)",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://2is7server1.rd.francetelecom.com/C4/C4-46_S2.isml/Manifest2",
    },
    MSS_LIVE_MALFORMED_MANIFEST_ERROR: {
        "name": "France 2 (Malformed Manifest error)",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://pc-selenium.rd.francetelecom.fr/video/MSS/France2%20-%20Manifest%20Error/Manifest",
    },
    MSS_LIVE_UNSUPPORTED_AUDIO_CODEC_ERROR: {
        "name": "France 2 (Unsupported audio codec error)",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://pc-selenium.rd.francetelecom.fr/video/MSS/France2%20-%20Audio%20Unsupported%20Codec/Manifest",
    },
    MSS_LIVE_UNKNOWN_MANIFEST_TYPE_ERROR: {
        "name": "France 2 (Unknown Manifest type error)",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://pc-selenium.rd.francetelecom.fr/video/MSS/France2-%20Unknown%20Manifest%20type/Manifest",
    },
    MSS_VOD_WRONG_AUDIO_CODEC_ERROR: {
        "name": "Arte (Wrong audio codec data)",
        "protocol": "MSS",
        "type": "VOD",
        "url": "http://pc-selenium.rd.francetelecom.fr/video/MSS/Arte%20-%20Wrong%20audio%20codec%20data/manifest",
    },
    MSS_LIVE_EMPTY_VIDEO_FOURCC_ERROR: {
        "name": "France 2 (FourCC video empty value)",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://pc-selenium.rd.francetelecom.fr/video/MSS/France2%20-%20Video%20FourCC%20empty/Manifest",
    },
    MSS_LIVE_VIDEO_FOURCC_UNSUPPORTED_ERROR: {
        "name": "France 2 (FourCC video unsupported value)",
        "protocol": "MSS",
        "type": "Live",
        "url": "http://pc-selenium.rd.francetelecom.fr/video/MSS/France2%20-%20Video%20FourCC%20Unsupported/Manifest",
    },
    HLS_LIVE_1: {
        "name": "VIMTV 1",
        "protocol": "HLS",
        "type": "Live",
        "url": "http://161.105.253.165/streaming/1.m3u8",
    },
    HLS_LIVE_2: {
        "name": "VIMTV 2",
        "protocol": "HLS",
        "type": "Live",
        "url": "http://161.105.253.165/streaming/2.m3u8",
    },
    HLS_LIVE_MANIFEST_MISSING_ERROR: {
        "name": "France 2 (M3U8 manifest missing)",
        "protocol": "HLS",
        "type": "Live",
        "url": "http://pc-selenium.rd.francetelecom.fr/video/HLS/ch1%20-%20Manifest%20missing/index.m3u8",
    }
});
