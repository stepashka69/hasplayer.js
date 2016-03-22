/*-----------------------------------------------------------------------------
 * FT R&D
 *------------------------------------------------------------------------------
 * Project     :
 *
 * Copyright France Telecom  [2010],  All Rights Reserved.
 *
 * This software is the confidential and proprietary
 * information of France Telecom.
 * You shall not disclose such Confidential Information
 * and shall use it only in accordance with the terms
 * of the license agreement you entered into with
 * France Telecom.
 *
 *------------------------------------------------------------------------------
 *
 * Created     : [05/03/10]
 * Last Change : [aa/mm/jj]
 * Author      : [Angot Nicolas]
 * Version     : [1.0]
 *
 * Miscellaneous : a javascript integration sample.
 *
 *------------------------------------------------------------------------------*/

var mediaObject = null;

/* Function: getJSPlayer
 *  return a pointer to Silverlight C# code : this function is called by Silverlight source code.
 */

window.Wrapper = {};
Wrapper.getJSPlayer = function() {
    return this;
};

Wrapper.opened = function(sender, e) {
    //volume au maximum
    mediaObject.setVolume({
        volume: 1
    });
    //pour le français
    mediaObject.setAudioLanguage({
        language: "fra"
    });
};

function onSilverLightBoxLoad(sender) {
    if (sender != null && sender != 0) {
        var plugin = sender.getHost();
        try {
            this.mediaObject = plugin.Content.mediaObject;
            //surcharger la fonction de chargement pour pouvoir changer la langue
            this.mediaObject.onOpened = Wrapper.opened;

            console.log("onSilverLightBoxLoad");
            load();
        } catch (e) {
            console.log(e);
        }
    }
}

function load() {
    var stream = {
        streamToLoad: {
            url: streamMss,
            autoplay: true,
            smoothStreaming: true
        }
    };
    mediaObject.load({
        request: JSON.stringify(stream)
    });
}

function onSourceDownloadProgressChanged(sender, eventArgs) {
    console.log("onSourceDownloadProgressChanged " + Math.round((eventArgs.progress * 1000)) / 10 + "%");
}

function toggleSL(divName) {
    if (document.getElementById(divName).style.display == 'none')
        document.getElementById(divName).style.display = '';
    else
        document.getElementById(divName).style.display = 'none';
}

function onSilverlightError(sender, args) {
    console.log(args.errorType + "- " + args.errorMessage);
}

Wrapper.onSetBrowserFocus = function(sender, /*FocusJSEvent*/ e) {
    var silvobj;
    if (e.focusType === 0) {
        silvobj = document.getElementById('silverlightFF');
        if (silvobj !== null)
            silvobj.nextSibling.focus();
    } else {
        silvobj = document.getElementById('silverlightFF');
        if (silvobj !== null)
            silvobj.previousSibling.focus();
    }
};

function disableElement(elementId, disable) {
    toggleDisabled(document.getElementById(elementId), disable);
}

function toggleDisabled(element, disable) {
    if (element) {
        try {
            element.disabled = disable;
        } catch (e) {}
        var buttons = element.getElementsByTagName("button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = disable;
        }
        var selects = element.getElementsByTagName("select");
        for (i = 0; i < selects.length; i++) {
            selects[i].disabled = disable;
        }
        var inputs = element.getElementsByTagName("input");
        for (i = 0; i < inputs.length; i++) {
            inputs[i].disabled = disable;
        }
    }
}

window.onblur = function() {
    if (mediaObject !== null) {
        mediaObject.setBlur();
    }
};

window.onfocus = function() {
    if (mediaObject !== null) {
        mediaObject.setFocus();
    }
};