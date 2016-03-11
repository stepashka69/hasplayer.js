
define([], function() {
        
    return {
        
        connectUser: function(command, platform) {
            console.log(platform);
            var p = new Promise((function(resolve, reject) {
                command.get(require.toUrl([platform.authent.url]))
                .then(this.onWassupLoaded.bind(this, command, platform, resolve, reject), this.onError.bind(this, reject));
            }).bind(this));

            return p;
        },

        onWassupLoaded: function(command, platform, resolve, reject) {
            command
            .findById('default_f_credential')
            .clearValue()
            .end()
            .execute(function(email) {
                document.getElementById('default_f_credential').value = email;
            }, [platform.authent.user.email])
            .findById('default_f_password')
            .clearValue()
            .click().type(platform.authent.user.pwd).end()
            .findByCssSelector('.sc_default_button_2 input')
            .click().end()
            .sleep(2000)
            .then(function() {
                if (platform.name == "QUALIF") {
                    return command.findByXpath('.//font[@color="green"]')
                    .getVisibleText()
                    .then(resolve, reject);
                } else {
                    return function() {
                        resolve("OK");
                    };
                }
            }, reject);
            
        },

        onError: function(reject) {
            reject();
        }

    };
});

