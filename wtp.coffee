party_roots = ['http://localhost:8080', 'http://localhost:8081', 'http://wtp1', 'http://wtp2', 'http://wtp3']

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

# add handlers to links
bindAnchors = ->
    els = ([el, part] for [el, part] in ([e, mirrorPart(e.href)] for e in document.getElementsByTagName('a')) when part)
    for [el, part] in els
        el.style.color = 'lightblue'
        el.setAttribute 'mirror-part', part
        do (el, part) ->
            el.addEventListener('click', (event) ->
                # event handler
                return false if el.getAttribute 'doing-click' # XXX guard saves wasted work if user hammers link
                el.setAttribute 'doing-click', true

                # XXX needs various IE crap
                event.preventDefault()
                openLink el
                return false
            false)

# make a nice container for wtp-messages
makeMesgBox = ->
    body = document.getElementsByTagName('body').item(0)
    box = document.createElement 'div'
    box.id = 'wtp-box'
    body.appendChild box

    messages = document.createElement 'div'
    messages.id = 'wtp-messages'
    messages.className = 'wtp-hidden'
    box.appendChild messages

    toggle = document.createElement 'p'
    toggle.id = 'wtp-toggle'
    toggle.onclick = toggleMesgBox
    toggle.innerHTML = 'Show'

    box.appendChild toggle

# and a function to toggle wtp-box display
toggleMesgBox = ->
    messages = document.getElementById('wtp-messages')
    toggle = document.getElementById 'wtp-toggle'
    if toggle.innerHTML == 'Hide'
        messages.className = 'wtp-hidden'
        toggle.innerHTML = 'Show'
    else
        messages.className = 'wtp-shown'
        toggle.innerHTML = 'Hide'

# display a message to div#wtp-messages and console.log
showMesg = (msg...) ->
    m = if msg.length then msg[0] else ""
    for x in msg[1...]
        m += " " + x.toString()

    div = document.getElementById 'wtp-messages'
    p = document.createElement 'p'
    p.innerHTML = m
    div.appendChild(p)
    console.log m

# open a mirrored link
openLink = (el) ->
    href = el.href
    showMesg 'opening link', href
    el.style.color = 'green'
    mirrors = []

    for rpc in rpcs
        h = rpc.root + el.getAttribute('mirror-part')
        mirrors.push [h, rpc]

    # try each mirror *sequentially*
    # list of mirrors is captured in closure.
    # pop a mirror, check for page with HEAD. Recurse only on error.
    walkMirrors = ->
        if not mirrors.length
            # out of mirrors
            showMesg 'Sorry, no more mirrors for', href # XXX could use better URL?
            el.style.color = 'red'
            el.removeAttribute('doing-click')
        else
            # mirrors remaining
            [h_, rpc_] = mirrors.pop()
            showMesg 'checking', h_
            rpc_.request({url: h_, method: 'HEAD'},
                ( -> # success
                    showMesg 'going to', h_
                    el.style.color = 'blue'
                    el.removeAttribute('doing-click')
                    window.location = h_),
                ( -> # error
                    showMesg 'failed to load', h_
                    walkMirrors())
                )
    walkMirrors()


# list of active RPCs. Append in onReady callback
rpcs = []

# add the magic
install = ->
    # XXX also include name.html transport.
    for root in party_roots
        do (root) ->
            # XXX weirdness with me/closure is b/c the RPC is not passed to onReady callback
            me = new easyXDM.Rpc({remote: root+'/wtp/cors.html',
            onReady: (success) ->
                console.log "established CORS", root
                rpcs.push me},
            {remote: {request: {}}})
            me.root = root

    bindAnchors()
    makeMesgBox()
    showMesg 'Welcome to <a href=http://mirrorparty.org>WTP</a>'

window.addEventListener('load', install, false)

