
define(function () {

    var CHROME_CONFIG  = { browserName: 'chrome', /*version: '2.11', */platform: 'WINDOWS'/*,
                             "chromeOptions":{
                                    "args": ["user-data-dir"],
                                    "excludeSwitches":["disable-component-update"]
                             }*/
                         };
    var IE11_CONFIG    = { browserName: 'internet explorer', /*version: '11', */platform: 'WINDOWS' };
    var EDGE_CONFIG    = { browserName: 'MicrosoftEdge', platform: 'WINDOWS' };

    return {
		all: [ CHROME_CONFIG, IE11_CONFIG, EDGE_CONFIG ],

		chrome: [ CHROME_CONFIG ],

		ie: [ IE11_CONFIG ],

		edge: [ EDGE_CONFIG ]
	};
});
