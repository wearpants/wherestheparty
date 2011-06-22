Where's the Party?
------------------

Where's the Party (WTP) is a system for distributed partial mirroring. It functions like a client-side CDN, using Javascript to reconstruct the namespace that is a website across multiple domains.

About the Name
==============
Peer-to-peer and distributed systems suffer from an 'introduction problem': how does a client wishing to join the network find an entry node? Where's the Party solves this problem with a 'rumor net' - a client joins the network (the party) by asking someone who knows.

It's also funny and translates well into other languages.

TODO
====
 * update cryptographic signing to explain that signature checking is done in JS code on the current mirror, not the target (since the *code* may be compromised by an adversary); this likely requires Flash
 * add notes about Phase 2: obfuscation via non-semantic mutation + encryption, to thwart DPI/wire-level content filtering
 * add notes about Phase 3: automation of matching content to hosts. Matching service looks for tagged content on TPB, downloads, munges, splits and uploads to participating mirrors (via (S)FTP), with no manual action required.

Mode of Operation
=================
A website using WTP includes a piece of Javascript on each of its pages, and provides a list of mirrors at a known URL. This JS intercepts all clicks & loads (images, etc) for resources found on the mirrors. The JS checks the current server for the requested resource. If the resource is found, the browser is directed to load it from the current server.  If the server times out, returns a 404 or encounters a security error (see below), the JS checks for the resource in a list of mirrors, redirecting the client to the mirror where it was found. Only purely static sites are supported.  Certain resources (CSS, javascript) may be required to be present on all mirrors.

Each resource involved in WTP is cryptographically signed by a private key; the JS has access to the public key and uses it to verify the signature before redirecting *and* afterwards, on page load (XXX does this make sense?).

In the event no mirrors can be reached, or on a signing error, the user is notified (via popup), and presented with an option to alert the party sponsor (XXX or maybe not).

Using WTP
=========
Descriptions of the behavior & benefits/drawbacks of Where's the Party for different users.

Mirror Host
***********
The system is designed to make running a mirror host as simple as possible. No Apache configuration is required - only a directory to server static files (not necessarily the root). The redirection on 404 allows a very large site to be broken into manageable parts, enabling an individual mirror to participate while only hosting a fraction of the content.

Clients
*******
Clients often leave a page open in a browser, during which time their current mirror may be taken offline. However, since the list of mirrors is cached locally, they are able to continue browsing without interruption.

Censors
********
The taks of a censor is complicated by WTP. The administrative burden of takedowns or blocking is complicated by the large number of mirrors, in multiple jurisdictions. Host content which should not be censored on the same servers may make coarse blocking less appealing.

The use of cryptographic signing makes hijacking a mirror impossible.

Since the list of mirrors is public, it is relatively easy to discover the mirrors (once the censor understands how the system operates). Hopefully, new mirrors can be added quickly enough to stay ahead.

Censors may run mirrors themselves as honeypots, to collect IPs and other data of clients. This is more likely to be a problem if the system for creating mirrors is automated.


Implementaiton Notes
====================

Javascript
**********
Onload, JS on the current page adds a click handler to all links without a host speficied (or all links with a dummy prefix?). The click handler creates an iframe to check for the availability of the target before loading.

We break out of the single origin policy like so: The target page contains cooperating javascript that can notify (ping back) the parent when it loads successfully (ie, not 404), via manipulation of the iframe's name & location attributes (XXX Ian - can you explain your implementation a bit better)? Load timeouts are detected the usual way.

For resources that cannot execute javascript (images, PDFs, etc.), a separate party_checker.html is provided in the root of each target mirror. This takes as an anchor a path to verify on the mirror, verifies it via XHR and pings back the originating page as above. (XXX perhaps we should use this for *all* loads, including html files, instead of each file needing this logic?)

The mirror list is stored in a separate resource, so that it can be updated indpendently as new mirrors are added.

Cryptographic signatures are stored separately (foo.html.sig for foo.html) and are used by the cooperative code in the iframe target to verify the local file before pinging back. It could also be used on page load to verify contents. (XXX Brian, does this make any sense if an adversary can create its own signatures *and* control the JS used to verify them?  I really think we want the signatures for server B (target) to be verified by JS on server A (source). Dunno how to do this...)

Ideally, we use eliptic curve DSA from Stanford http://crypto.stanford.edu/sjcl/ . (XXX Brian says they haven't implemented this particular algo yet, but might be motivated if we had a use. Other suitable algos exist, see also: Zooko's blog).

Python
******
Python code (using lxml or similar) takes a tree of input files and a keypair, inserts the necessary JS and calculates signatures, producing a transformed tree.

Another script creates partial tarballs of a given byte size or percentage of total. It takes as input the transformed file tree, a list of mirrors, and a config file specifying which files need to be included in every mirror. Might also be neat to generate tarballs sequentially in user-speficied sizes (ie, so that it could be run behind a web UI where a user says 'gimme XX MB').

Bonus Features
==============

Obfuscation Variants
********************
It'd be nice to obfuscate party.js in variant ways to make detection harder (think old-school polymorphic viruses). Similarly with file names (such as party.js, party_checker.html), but that makes finding the correct file on the target mirror harder - maybe it's a hash of the mirror URL?

Partial Mirror Lists
********************
Each node only has a subset of the mirrors, not all of them. While this makes the system somewhat less durable, it makes takedown of the whole network more difficult.
