var streamMss = "http://2is7server1.rd.francetelecom.com/C4/C4-50_TVApp2.isml/Manifest";
var streamHls = "http://iphone.envivio.tv/iphone/downLoads/ch1/index.m3u8";

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        vars[key] = value;
    });
    return vars;
}

window.onload = function() {
        var version = parseFloat(bowser.version),
        // Get url params...
        vars = getUrlVars();

        if (vars && vars.hasOwnProperty("url")) {
            streamMss = streamHls = vars.url;
        }

        if (bowser.chrome || bowser.msie && version >= 11.0 || bowser.msedge /* || bowser.firefox && version >= */ ) {
            var controls = '';
            if (bowser.android) {
                controls = "controls='true'";
            }

            document.body.innerHTML = "<div id='demo-player-container' class='demo-player' tabindex='0'>" +
                "<div id='VideoModule' class='op-video'>" +
                "<video id='player'" + controls + "></video>" +
                "</div>" +
                " <div id='LoadingModule' class='op-loading op-none'>" +
                " <div class='spinner'>" +
                "<div class='spinner-container container1'>" +
                "<div class='circle1'></div>" +
                "<div class='circle2'></div>" +
                "<div class='circle3'></div>" +
                "<div class='circle4'></div>" +
                "</div>" +
                "<div class='spinner-container container2'>" +
                "<div class='circle1'></div>" +
                "<div class='circle2'></div>" +
                "<div class='circle3'></div>" +
                "<div class='circle4'></div>" +
                "</div>" +
                "<div class='spinner-container container3'>" +
                "<div class='circle1'></div>" +
                "<div class='circle2'></div>" +
                "<div class='circle3'></div>" +
                "<div class='circle4'></div>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>";
            createHasPlayer(true);
        } else if (bowser.iphone || bowser.ipad || bowser.ipod || bowser.safari) {
            window.location = streamHls;
        } else {
            document.body.innerHTML = "<object id='SL1' data='data:application/x-silverlight-2,' type='application/x-silverlight-2' width='100%' height='100%'>" +
                "<param name=\"source\" value=\"Silverlight/ClientBin/CorePlayer.xap\"/>" +
                "<param name='onerror' value='onSilverlightError' />" +
                "<param name='onload' value='onSilverLightBoxLoad' />" +
                "<param name='background' value='black' />" +
                "<param name='initParams' value='GUIMode=None,jsId=BoxSL5488,JSEnabled=true,mode=VOD'/>" +
                "<param name='minRuntimeVersion' value='4.0.50303' />" +
                "<param name='autoUpgrade' value='true' />" +
                "<param name='SplashScreenSource' value='Silverlight/SplashScreen/SimpleSplashScreen.xaml' />" +
                "<param name='onsourcedownloadprogresschanged' value='onSourceDownloadProgressChanged' />" +
                "<param name='EnableGPUAcceleration' value='true' />" +
                "<param name='EnableCacheVisualization' value='false' />" +
                "<param name='EnableFramerateCounter' value='false'/>" +
                "<param name='Windowless' value='true'/>" +
                "<param name='uiculture' value='fr' />" +
                "<a href='http://go.microsoft.com/fwlink/?LinkID=149156&v=4.0.50303.0' style='text-decoration:none'>" +
                "    <img src='http://go.microsoft.com/fwlink/?LinkId=108181' alt='Get Microsoft Silverlight' style='border-style:none'/>" +
                "</a>" +
                "</object>";
        }
};