
define([],
    function () {
        var defaultTimeout  = 5000;

    return {
        setup:function(command){
            command.setExecuteAsyncTimeout(defaultTimeout);
            return command;
        },

        executeAsync:function(command, scripts, args, timeout){
        
            var p = new Promise(function(resolve, reject){
                var originalTimeout = defaultTimeout;
                if(timeout){
                    originalTimeout = command.getExecuteAsyncTimeout();
                    command.setExecuteAsyncTimeout(timeout + defaultTimeout);
                }
                command.executeAsync(scripts, args).then(
                    function(result){
                        if(timeout){
                            command.setExecuteAsyncTimeout(originalTimeout);
                        }
                        resolve(result);
                    },
                    function(result){
                        if(timeout){
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

