define([], function(){

    
    return {
        executeRule: function(rule, proxyUrl, done){
           window.rule = rule;
           window.proxyUrl = proxyUrl;
           var xhr =  new XMLHttpRequest();
            xhr.onload = function(){
                console.warn('request sent')
                if(this.status ===200){
                    done(JSON.parse(this.response).ruleId);
                }else{
                    done(false);
                }
            };
            console.warn("execute rule", JSON.stringify(rule), proxyUrl);
            xhr.open('POST', proxyUrl+'add.json', true);
            xhr.send(JSON.stringify(rule));
            console.warn("sending request");
         },
            
         deleteRule: function(ruleId){
            
        }
    };
});