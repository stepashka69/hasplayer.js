define({

    prod: {
        name: "PROD",
        authent: {
            url: 'https://id.orange.fr',
            user: {
                email: "maps.poss@orange.fr",
                pwd: "webtv12"
            }
        },
        streams_base_url: 'chaines-tv.orange.fr'
    },

    qualif: {
        name: "QUALIF",
        authent: {
            url: 'https://id-rec.orange.fr',
            user: {
                email: "vodpcclienta@orange.fr",
                pwd: "Passwd1"
            }
        },
        streams_base_url: 'qualif.r3pc-live.rec.orange.fr'
    }
});
