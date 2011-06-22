BASES = [
         'http://wherestheparty.localhost',
         'http://wherestheparty2.localhost/backup'
         ];


if (location.hash.search(/#pingback/) != -1) {
    var match = /#pingback(\d+)=(.*)/.exec(location.hash);
    var succeeded = false;
    try {
        parent.pingBack(match[1]);
        succeeded = true;
    } catch (e) {
    }
    if (! succeeded) {
        window.name = 'pinged ' + match[1];;
        window.location = match[2];
    }
} else if (window.name.substr(0, 7) == 'pinged ') {
    if (parent !== window) {
        parent.pingBack(window.name.substr(7));
    } else {
        window.name = '';
    }
}

// Timeout in milliseconds when we decide the page can't load:
var TIMEOUT = 3000;

var _callbacks = {};

function createIframe(src) {
    var el = document.createElement('iframe');
    el.width = 100;
    el.height = 100;
    el.setAttribute('style', 'border: 2px solid #ff0;');
    document.body.appendChild(el);
    el.src = src;
    return el;
}

function isMirrorable(href) {
    /* Returns true if the domain is one of the mirrors */
    for (var i=0; i<BASES.length; i++) {
        if (href.substr(0, BASES[i].length) == BASES[i]) {
            return true;
        }
    }
    return false;
}

var triedURLs = {};

function getNextURL(keyURL, failedURL) {
    var alreadyTried = triedURLs[keyURL];
    if (alreadyTried === undefined) {
        triedURLs[keyURL] = alreadyTried = [failedURL];
    }
    var urls = [];
    var path = null;
    for (var i=0; i<BASES.length; i++) {
        var base = BASES[i];
        if (failedURL.substr(0, base.length) == base) {
            // This is the URL we have
            path = failedURL.substr(base.length);
            break;
        }
    }
    if (! path) {
        console.log('Not a recognized URL', failedURL);
        return null;
    }
    if (BASES.length == alreadyTried.length) {
        // We've tried everything
        console.log('tried everything', failedURL, alreadyTried);
        return null;
    }
    var options = [];
    for (var i=0; i<BASES.length; i++) {
        var base = BASES[i];
        var newURL = base + path;
        var exists = false;
        for (var j=0; j<alreadyTried.length; j++) {
            if (newURL == alreadyTried[j]) {
                exists = true;
                break;
            }
        }
        if (! exists) {
            options.push(newURL);
        }
    }
    var next = options[parseInt(Math.random() * options.length)];
    alreadyTried.push(next);
    return next;
}


function bindAnchors() {
    var els = document.getElementsByTagName('a');
    for (var i=0; i<els.length; i++) {
        var el = els[i];
        if (! isMirrorable(el.href)) {
            continue;
        }
        (function (el) {
            el.addEventListener('click', function (event) {
                // check for #tag, then we don't need this at all
                if (! el.getAttribute('clicking')) {
                    el.setAttribute('clicking', '1');
                    el.setAttribute('original-text', el.innerHTML);
                    el.innerHTML += ' (loading...)';
                } else {
                    // Cancel, we are already linking stuff
                    return false;
                }
                event = event || window.event;
                // fixme: needs IE thing:
                event.preventDefault();
                var href = event.target.href;
                openLink(el, href);
                return false;
            }, false);
        })(el);
    }
}

var _counter = 0;
function makeId() {
    return (_counter++) + "";
}

function openLink(el, href, keyURL) {
    var loaded = false;
    var id = makeId();
    var pingHref = href.replace(/#.*/, "") + "#pingback" + id +
                   "=" + location.href;
    if (keyURL === undefined) {
        keyURL = href;
    }
    function success() {
        clearTimeout(timeoutId);
        window.location = href;
    }
    _callbacks[id] = success;
    var timeoutId = setTimeout(function () {
        // Means loading has failed
        //iframe.parentNode.removeChild(iframe);
        if (id in _callbacks) {
            delete _callbacks[id];
        }
        // Now try the next domain
        var next = getNextURL(keyURL, href);
        if (next === null) {
            // oh no, total failure
            el.removeAttribute('clicking');
            el.innerHTML = el.getAttribute('original-text') + ' (failed)';
            el.removeAttribute('original-text');
            return;
        }
        openLink(el, next, keyURL);
    }, TIMEOUT);
    var iframe = createIframe(pingHref);
    // debugging statements:
    giframe.push(iframe);
}

function pingBack(id) {
    if (! _callbacks[id]) {
        console.log('lost callback', id);
    } else {
        _callbacks[id]();
    }
}

giframe = [];

window.addEventListener('load', function () {
    bindAnchors();
}, false);
