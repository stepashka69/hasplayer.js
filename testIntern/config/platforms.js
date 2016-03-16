define({

    prod: {
        name: "PROD",
        authent: {
            url: "https://sso.orange.fr/WT/userinfo/?serv={service}&info=dsn,cooses&wt-email={user.email}&wt-pwd={user.pwd}&wt-cvt=4&wt-cooses&wt-mco=MCO=OFR",
            user: {
                email: "maps.poss@orange.fr",
                pwd: "webtv12"
            },
            service:"VOD-EW"
        },
        streams_base_url: 'chaines-tv.orange.fr'
    },

    qualif: {
        name: "QUALIF",
        authent: {
            url: 'https://ssl-tb1n.orange.fr/WT/userinfo/?serv={service}&info=dsn,cooses&wt-email={user.email}&wt-pwd={user.pwd}&wt-cvt=4&wt-cooses&wt-mco=MCO=OFR',
            user: {
                email: "vodpcclienta@orange.fr",
                pwd: "Passwd1"
            },
            service:"VOD-EW"
        },
        streams_base_url: 'qualif.r3pc-live.rec.orange.fr'
    }
});
