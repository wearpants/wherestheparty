party_roots = ['http://localhost:8080', 'http://localhost:8081', 'http://wtp1', 'http://wtp2', 'http://wtp3']

# roots, etc.
parties = {}

# return the relative part (path) of a mirrorable URI or null if URI is not mirrorable
mirrorPart = (href) ->
    ###
    XXX should things with query be included? Who knows how servers will react.
    It's almost certainly an input error.
    XXX Should probably filter out #hash on current mirror
    ###
    for root in party_roots
        return href[root.length...] if href[...root.length] == root
    return null

bindAnchors = ->
    els = ([el, part] for [el, part] in ([e, mirrorPart(e.href)] for e in document.getElementsByTagName('a')) when part)
    for [el, part] in els
        el.style.color = 'red'
        el.setAttribute 'mirror-part', part
        do (el, part) ->
            el.addEventListener('click', (event) ->
                # event handler
                return false if el.getAttribute 'doing-click'
                el.setAttribute 'doing-click', true

                # XXX needs various IE crap
                event.preventDefault()
                openLink el, event.target.href
                return false
            false)

showMesg = (msg...) ->
    m = if msg.length then msg[0] else ""
    for x in msg[1...]
        m += " " + x.toString()

    div = document.getElementById 'wtp-messages'
    p = document.createElement 'p'
    p.innerHTML = m
    div.appendChild(p)
    console.log m

checkLink = (href, rpc, successFn, errorFn) ->
    showMesg 'checking', href
    rpc.request {url: href, method: 'HEAD'}, successFn, errorFn

goThere = (h) ->
    showMesg 'going to', h
    window.location = h

openLink = (el, href) ->
    showMesg 'opening link', href
    # XXX blast everything off in parallel, first one wins? eh
    for root, rpc of parties
        h = root + el.getAttribute('mirror-part')
        if rpc.alive
            do (h, rpc) ->
                checkLink(h, rpc, (-> goThere h), (-> showMesg 'failed to load', h) )
                el.removeAttribute('doing-click')
        else
            showMesg 'skipping', h, 'because RPC setup failed'

    # XXX if everything fails, do something useful (alert?)

install = ->
    # XXX also include name.html transport.
    for root in party_roots
        do (root) ->
            parties[root] = new easyXDM.Rpc({remote: root+'/wtp/cors.html',
            onReady: (success) ->
                console.log "established CORS", root
                parties[root].alive = true},
            {remote: {request: {}}})

    bindAnchors()
    showMesg 'Welcome to <a href=http://mirrorparty.org>WTP</a>'


window.addEventListener('load', install, false)

window.WTP = {}
window.WTP.parties = parties

