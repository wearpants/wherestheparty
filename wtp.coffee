party_roots = ['http://wtp1', 'http://wtp2', 'http://wtp3']

makeCORS = (root) ->
    new easyXDM.Rpc({remote: root+'/wtp/cors.html'}, {remote: {request: {}}})

party_rpcs = (makeCORS(x) for x in party_roots)
local_rpc = makeCORS(local_root)

# is href a mirrorable URL?
isMirrorable = (href) ->
    ###
    XXX should things with query be included? Who knows how servers will react.
    It's almost certainly an input error.
    ###
    uri = new URI href
    return false if uri.scheme() or uri.hierpart().authority() or uri.query # cannot deal at all
    return false if not uri.heirpart().path() and uri.fragment() # just a fragment
    return true # empty path, or path w/ optional fragment

bindAnchors = ->
    els = (e for e in document.getElemetsByTagName 'a' if isMirrorable e)
    for e in els
        do (e) ->
            e.addEventListener('click', (event) ->
                # event handler
                return false if e.getAttribute 'doing-click'
                e.setAttribute 'doing-click', true
                e.setAttribute 'orig-text', e.innerHTML
                e.innerHTML += ' (loading...)'

                # XXX needs various IE crap
                event.preventDefault()
                openLink e, event.target.href
                return false
            false)

checkLink = (href, rpc, successFn, errorFn) ->
    rpc.request({url: href, method: 'HEAD'},
    (response) -> if response.status == 200 then successFn else errorFn ,
    errorFn)

openLink (e, href) ->
    # XXX blast everything off in parallel, first one wins? eh
    h = (new URI local_root).resolveReference(href).toAbsolute().toString()
    checkLink(h, local_rpc, (-> window.location = h), (-> console.log('OH FUCKING NOES', h)))

    for i in [0...party_roots]
        rpc = party_rpcs[i]
        h = (new URI party_roots[i]).resolveReference(href).toAbsolute().toString()
        do (h, rpc) ->
            checkLink(h, rpc, (-> window.location = h), (-> console.log('OH FUCKING NOES', h)))

    # XXX if everything fails, do something useful (alert?)

# export some vars
ns = exports ? this.wtp = {}

ns.party_roots = party_roots
ns.isMirrorable = isMirrorable
ns.parseURI = parseURI

