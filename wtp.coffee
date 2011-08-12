party_roots = ['http://localhost:8080', 'http://localhost:8081', 'http://wtp1', 'http://wtp2', 'http://wtp3']

console.log 'roots', party_roots

# XXX if RPC setup fails, remove from party_roots
makeCORS = (root) ->
    new easyXDM.Rpc({remote: root+'/wtp/cors.html'}, {remote: {request: {}}})

party_rpcs = (makeCORS(x) for x in party_roots)

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
                el.setAttribute 'orig-text', el.innerHTML
                el.innerHTML += ' (loading...)'

                # XXX needs various IE crap
                event.preventDefault()
                openLink el, event.target.href
                return false
            false)

errorFn = (response) ->
    console.log 'errorFn', response

checkLink = (href, rpc, successFn, errorFn) ->
    console.log 'check', href
    rpc.request({url: href, method: 'HEAD'}, successFn, errorFn)

goThere = (h) ->
    console.log 'going to', h
    window.location=h

openLink = (el, href) ->
    console.log('openLink', el, href)
    # XXX blast everything off in parallel, first one wins? eh
    for i in [0...party_roots.length]
        rpc = party_rpcs[i]
        h = party_roots[i] + el.getAttribute('mirror-part')
        do (h, rpc) ->
            checkLink(h, rpc, (-> goThere h), errorFn )

    # XXX if everything fails, do something useful (alert?)

window.addEventListener('load', (-> bindAnchors()), false)

