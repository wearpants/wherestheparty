party_roots = ['http://localhost:8080', 'http://wtp1', 'http://wtp2', 'http://wtp3']

makeCORS = (root) ->
    new easyXDM.Rpc({remote: root+'/wtp/cors.html'}, {remote: {request: {}}})

party_rpcs = (makeCORS(x) for x in party_roots)

# is href a mirrorable URL?
mirrorPart = (href) ->
    ###
    XXX should things with query be included? Who knows how servers will react.
    It's almost certainly an input error.
    XXX Should probably filter out #hash on current mirror
    ###
    for root in party_roots
        return href[root.length...href.length] if href[0...root.length] == root
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

checkLink = (href, rpc, successFn, errorFn) ->
    console.log 'check', href
    rpc.request({url: href, method: 'HEAD'},
    (response) -> if response.status == 200 then successFn else errorFn ,
    errorFn)

goThere = (h) ->
    console.log 'going to', h
    window.location=h

openLink = (el, href) ->
    console.log('openLink', el, href)
    # XXX blast everything off in parallel, first one wins? eh
    for i in [0...party_roots.length]
        rpc = party_rpcs[i]
        h = party_roots[i] + el.getAttribute('mirror-part')
        console.log('wat', h, rpc)
        do (h, rpc) ->
            console.log('wut', h, rpc)
            checkLink(h, rpc, (-> goThere h), (-> console.log('OH FUCKING NOES', h)))

    # XXX if everything fails, do something useful (alert?)

window.addEventListener('load', (-> bindAnchors()), false)

