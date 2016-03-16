
define([], function() {
        
    return {
        
        connectUser: function(command, platform) {
            console.log(platform);
            var p = new Promise((function(resolve, reject) {
                var url = platform.authent.url;
                console.info("url",url);
                url = url.replace("{service}", platform.authent.service);
                 console.info("url",url);
                url = url.replace("{user.email}", platform.authent.user.email);
                url = url.replace("{user.pwd}", platform.authent.user.pwd);
                console.info("url", url);
                command.get(require.toUrl([url]))
                .then(this.onWassupLoaded.bind(this, command, platform, resolve, reject), this.onError.bind(this, reject));
            }).bind(this));

            return p;
        },

        onWassupLoaded: function(command, platform, resolve, reject) {
            command
            .findByXpath('.//ident[@name="ulo"]')
            .getSpecAttribute('value')
            .then(resolve, reject);           
        },

        onError: function(reject) {
            reject();
        }

    };
});

