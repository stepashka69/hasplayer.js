define({
    url:"http://pc-selenium.rd.francetelecom.fr:3129/",
    rules:{
        not_found:{
            "type":"ON_REQUEST",
            "name":"not_found",
            "responseOverride":{
                "status":404,
                "overrideBody":true,
                "body":"fragment non disponible",
                "overrideHeaders":true,
                "headers":{
                    "content-type":"text/html"
                }
            }
        }
    }
});