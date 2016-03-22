define([], function(){

    
    return {
        executeRule: function(rule, proxyUrl, done){
           var xhr =  new XMLHttpRequest();
            xhr.onload = function(){
                if(this.status ===200){
                    done(JSON.parse(this.response).ruleId);
                }else{
                    done(false);
                }
            };
            xhr.open('POST', proxyUrl+'add.json', true);
            xhr.send(JSON.stringify(rule));
         },
        
        resetRules:function(proxyUrl,done){
             var xhr =  new XMLHttpRequest();
            xhr.onload = function(){
                if(this.status ===200){
                    done(true);
                }else{
                    done(false);
                }
            };
            xhr.open('GET', proxyUrl+'reset.json', true);
            xhr.send();
        }
    };
});