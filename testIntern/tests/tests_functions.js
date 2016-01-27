
define([],
    function () {
        var defaultTimeout  = 5000;

    return {

        setup: function(command) {
            command.setExecuteAsyncTimeout(defaultTimeout);
            return command;
        },

        log: function(tag, message) {
            console.log('[' + tag + '] ', message);
        },

        executeAsync: function(command, scripts, args, timeout) {
        
            var p = new Promise(function(resolve, reject) {
                var originalTimeout = defaultTimeout;
                if (timeout) {
                    originalTimeout = command.getExecuteAsyncTimeout();
                    command.setExecuteAsyncTimeout(timeout * 1000);
                }
                command.executeAsync(scripts, args).then(
                    function(result) {
                        if (timeout) {
                            command.setExecuteAsyncTimeout(originalTimeout);
                        }
                        resolve(result);
                    },
                    function(result) {
                        if (timeout) {
                            command.setExecuteAsyncTimeout(originalTimeout);
                        }
                        reject(result);
                    }
                );


            });
            return p;
        }

    };
});

