(function() {
  var bindAnchors, install, makeMesgBox, mirrorPart, openLink, rpcs, showMesg, toggleMesgBox;
  var __slice = Array.prototype.slice;
  mirrorPart = function(href) {
    /*
        XXX should things with query be included? Who knows how servers will react.
        It's almost certainly an input error.
        XXX Should probably filter out #hash on current mirror
        */
    var root, _i, _len;
    for (_i = 0, _len = party_roots.length; _i < _len; _i++) {
      root = party_roots[_i];
      if (href.slice(0, root.length) === root) {
        return href.slice(root.length);
      }
    }
    return null;
  };
  bindAnchors = function() {
    var e, el, els, part, _i, _len, _ref, _results;
    els = (function() {
      var _i, _len, _ref, _ref2, _results;
      _ref = (function() {
        var _j, _len, _ref, _results2;
        _ref = document.getElementsByTagName('a');
        _results2 = [];
        for (_j = 0, _len = _ref.length; _j < _len; _j++) {
          e = _ref[_j];
          _results2.push([e, mirrorPart(e.href)]);
        }
        return _results2;
      })();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], el = _ref2[0], part = _ref2[1];
        if (part) {
          _results.push([el, part]);
        }
      }
      return _results;
    })();
    _results = [];
    for (_i = 0, _len = els.length; _i < _len; _i++) {
      _ref = els[_i], el = _ref[0], part = _ref[1];
      el.style.color = 'lightblue';
      el.setAttribute('mirror-part', part);
      _results.push((function(el, part) {
        return el.addEventListener('click', function(event) {
          if (el.getAttribute('doing-click')) {
            return false;
          }
          el.setAttribute('doing-click', true);
          event.preventDefault();
          openLink(el);
          return false;
        }, false);
      })(el, part));
    }
    return _results;
  };
  makeMesgBox = function() {
    var body, box, messages, toggle;
    body = document.getElementsByTagName('body').item(0);
    box = document.createElement('div');
    box.id = 'wtp-box';
    body.appendChild(box);
    messages = document.createElement('div');
    messages.id = 'wtp-messages';
    messages.className = 'wtp-hidden';
    box.appendChild(messages);
    toggle = document.createElement('p');
    toggle.id = 'wtp-toggle';
    toggle.onclick = toggleMesgBox;
    toggle.innerHTML = 'Show';
    return box.appendChild(toggle);
  };
  toggleMesgBox = function() {
    var messages, toggle;
    messages = document.getElementById('wtp-messages');
    toggle = document.getElementById('wtp-toggle');
    if (toggle.innerHTML === 'Hide') {
      messages.className = 'wtp-hidden';
      return toggle.innerHTML = 'Show';
    } else {
      messages.className = 'wtp-shown';
      return toggle.innerHTML = 'Hide';
    }
  };
  showMesg = function() {
    var div, m, msg, p, x, _i, _len, _ref;
    msg = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    m = msg.length ? msg[0] : "";
    _ref = msg.slice(1);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      m += " " + x.toString();
    }
    div = document.getElementById('wtp-messages');
    p = document.createElement('p');
    p.innerHTML = m;
    div.appendChild(p);
    return console.log(m);
  };
  openLink = function(el) {
    var h, href, mirrors, rpc, walkMirrors, _i, _len;
    href = el.href;
    showMesg('opening link', href);
    el.style.color = 'green';
    mirrors = [];
    for (_i = 0, _len = rpcs.length; _i < _len; _i++) {
      rpc = rpcs[_i];
      h = rpc.root + el.getAttribute('mirror-part');
      mirrors.push([h, rpc]);
    }
    walkMirrors = function() {
      var h_, rpc_, _ref;
      if (!mirrors.length) {
        showMesg('Sorry, no more mirrors for', href);
        el.style.color = 'red';
        return el.removeAttribute('doing-click');
      } else {
        _ref = mirrors.pop(), h_ = _ref[0], rpc_ = _ref[1];
        showMesg('checking', h_);
        return rpc_.request({
          url: h_,
          method: 'HEAD'
        }, (function() {
          showMesg('going to', h_);
          el.style.color = 'blue';
          el.removeAttribute('doing-click');
          return window.location = h_;
        }), (function() {
          showMesg('failed to load', h_);
          return walkMirrors();
        }));
      }
    };
    return walkMirrors();
  };
  rpcs = [];
  install = function() {
    var root, _fn, _i, _len;
    _fn = function(root) {
      var me;
      me = new easyXDM.Rpc({
        remote: root + cors_path,
        onReady: function(success) {
          console.log("established CORS", root);
          return rpcs.push(me);
        }
      }, {
        remote: {
          request: {}
        }
      });
      return me.root = root;
    };
    for (_i = 0, _len = party_roots.length; _i < _len; _i++) {
      root = party_roots[_i];
      _fn(root);
    }
    bindAnchors();
    makeMesgBox();
    return showMesg('Welcome to <a href=http://mirrorparty.org>WTP</a>');
  };
  window.addEventListener('load', install, false);
}).call(this);
