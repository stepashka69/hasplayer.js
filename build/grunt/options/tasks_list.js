module.exports = {

    info: {
        options: {
            tasks: [{
                name: 'build_hasplayer',
                info: 'Create built and minified versions of the player (without samples). Options:\n\n' +
                    '-protocol dash,mss,hls     Embed specified protocols. Dash is always included but specifying it alone will exclude other protocols.\n\n' +
                    '-protection                Include/exclude protection module.\n\n' +
                    '-proxy                     Include/exclude OrangeHasPlayer proxy.\n\n' +
                    '-analytics                 Include/exclude analytics.\n\n' +
                    '-vowv                      Include/exclude source code for VO Widevine pssh generation.\n\n' +
                    '-metricsAgent              Include/exclude MetricsAgent in hasplayer distribution.\n\n' +
                    '-rules has,dashif          Include/exclude dashif has rules or orange in hasplayer distribution.\n\n'
            }, {
                name: 'build_dashif_sample',
                info: 'Create built version of DashIF sample application.\n' +
                      'It requires hasplayer with NO proxy.\n'
            }, {
                name: 'build_orange_sample',
                info: 'Create built version of Orange Has Player sample application.\n' +
                      'It requires hasplayer with proxy.\n'
            }, {
                name: 'doc',
                info: 'Generate API documentation.\n'
            }, {
                name: 'test',
                info: 'Run a syntaxic test on each player source file and show errors/warnings.\n'
            }, {
                name: 'help',
                info: 'Well... you\'re running it ;)\n'
            }]
        }
    }

};
