module.exports = function(grunt) {

    var protocols  = grunt.option('protocol'),
        protection = grunt.option('protection'),
		proxy = grunt.option('proxy'),
        metricsAgent = grunt.option('metricsAgent'),
        analytics = grunt.option('analytics'),
        vowv = grunt.option('vowv'),
        hls = true,
        mss = true;

    // Must check the type because it can be a boolean flag if no arguments are specified after the option.
    if (typeof(protocols) === 'string') {
        protocols = grunt.option('protocol').toLowerCase().split(',');
        hls = mss = false;

        for (var i in protocols) {
            if (protocols[i] === 'hls') {
                hls = true;
            } else if (protocols[i] === 'mss') {
                mss = true;
            }
            else if (protocols[i] !== 'dash') {
                console.error("PREPROCESS ERROR: protocol '" + protocols[i] + "' is not supported. Expected 'hls', 'mss' or 'dash'.");
            }
        }
    }

    if (typeof(protection) !== 'boolean') {
        // protection is always included unless boolean is set to false
        protection = true;
    }
	
	if (typeof(proxy) !== 'boolean') {
        proxy = false;
    }

    if (typeof(metricsAgent) !== 'boolean') {
        metricsAgent = false;
    }

    if (typeof(analytics) !== 'boolean') {
        // analytics is always included unless boolean is set to false
        analytics = true;
    }

    if ((typeof(vowv) !== 'boolean') || (mss === false)) {
        // include VO WV pssh generation only if mss is activated
        vowv = false;
    }

    var sendError = function(params) {
        return  'this.errHandler.sendError(' + params[0] + ', ' + params[1] + ');';
    };

    var reject = function(params) {
        return 'return Q.reject(' + params[0] + ')';
    };

    return {
        options: {
            context : {
                HLS: hls,
                MSS: mss,
                METRICS_AGENT:metricsAgent,
                VOWV:vowv,
                PROTECTION: protection,
				PROXY: proxy,
                ANALYTICS:analytics,
                sendError: sendError,
                reject: reject
            }
        },
        multifile : {
            files : {
                '<%= preprocesspath %>/Context.js' : '<%= rootpath %>/app/js/streaming/Context.js',
                '<%= preprocesspath %>/playerSrc.html' : '<%= rootpath %>/samples/playerSrc.html',
                '<%= preprocesspath %>/Stream.js' : '<%= rootpath %>/app/js/streaming/Stream.js',
                '<%= preprocesspath %>/MssParser.js' : '<%= rootpath %>/app/js/mss/MssParser.js'
            }
        }
    };
};
