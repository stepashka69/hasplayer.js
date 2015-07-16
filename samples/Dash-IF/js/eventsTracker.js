var video = document.querySelector('video'),
    detailledMessage=false,
    events = {'abort' : 'Envoyé lorsque la lecture est annulée ; par exemple il sera envoyé si le média est en cours de lecture et redémarré depuis le début.',
              'canplay':  'Envoyé lorsque suffisamment de données sont disponibles pour débuter la lecture du média, au moins pour quelques premières images. Il correspond à la valeur CAN_PLAY de readyState.',
              'canplaythrough': 'Envoyé lorsque l\'état devient CAN_PLAY_THROUGH, ce qui indique que le média peut être entièrement lu sans interruption, en supposant que la vitesse de téléchargement reste au niveau actuel.',
              'canshowcurrentframe': 'L\'image courante est chargée et peut être présentée. Ceci correspond à la valeur CAN_SHOW_CURRENT_FRAME de readyState.',
              'dataunavailable': 'Envoyé lorsque l\'état devient DATA_UNAVAILABLE.',
              'durationchange': 'Les métadonnées ont été chargées ou modifiées, ce qui indique un changement dans la durée du média. Sera par exemple envoyé lorsque le média est suffisamment chargé pour que sa durée soit connue.',
              'emptied':'Le média est devenu vide ; par exemple si le média est déjà chargé (ou partiellement chargé) et qu\'on appelle la méthode load() pour le recharger',
              'empty':'Envoyé lorsqu\'une erreur survient et que le média est vide.',
              'ended': 'Envoyé lorsque la lecture se termine.',
              'error': 'Envoyé lorsqu\'une erreur se produit. L\'attribut error de l\'élément contient plus d\'informations.',
              'loadedfirstframe': 'La première image du média a été chargée.',
              'loadedmetadata': 'Les métadonnées du média ont été chargées ; tous les attributs contiennent autant d\'informations que possible.',
              'loadstart':'Envoyé lorsque le chargement du média débute.',
              'pause': 'Envoyé lorsque la lecture est interrompue.',
              'play': 'Envoyé lorsque la lecture débute ou reprend.',
              'progress': 'Envoyé périodiquement pour informer les parties intéressées de la progression du téléchargement du média. '+
                           'L\'évènement progress dispose de trois attributs : lengthComputable (vaut true si la taille totale du média est connue, false sinon.)'+
                           ' loaded (Le nombre d\'octets du fichier de média qui ont été reçus jusqu\'à présent.)'+
                           ' total (Le nombre total d\'octets dans le fichier de média.)',
              'ratechange' : 'Envoyé lorsque la vitesse de lecture change.',
              'seeked': 'Envoyé lorsqu\'une opération de positionnement est effectuée.',
              'seeking': 'Envoyé lorsqu\'une opération de positionnement débute.',
              'suspend': 'Envoyé lorsque le chargement du média est interrompu ; cela peut arriver parce que le téléchargement est terminé ou parce qu\'il a été mis en pause pour toute autre raison.',
              // 'timeupdate : 'Le temps indiqué par l'attribut currentTime de l'élément a été modifié.',
              'volumechange': 'Envoyé lorsque le volume audio est modifié (qu\'il s\'agisse d\'une modification du volume ou d\'un changement de l\'attribut muted).',
              'waiting': 'Envoyé lorsque l\'opération demandée (comme une lecture) est retardée en attendant la fin d\'une autre opération (comme un positionnement).'},
    enumReadyState = {
        "0":"HAVE_NOTHING",
        "1":"HAVE_METADATA",
        "2":"HAVE_CURRENT_DATA",
        "3":"HAVE_FUTURE_DATA",
        "4":"HAVE_ENOUGH_DATA"
    },
    callback = function(e){
        console.warn('received videoEvent', e.type,(detailledMessage)? events[e.type] : "", e, enumReadyState[""+video.readyState]);
    };

if(video){
    for(var key in events){
        video.addEventListener(key, callback);
    }
    console.warn("video events tracker connected");
}

