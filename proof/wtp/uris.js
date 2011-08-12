/**
 * @fileOverview
 * 
 * URI support as per rfc3986
 * - Client and Serverside ECMA-262 v3 compatible, node.js friendly
 * - All classes extend the native String implementation
 * - Full test suite can be launched by running URI.Test();
 * 
 * @author Nathan <http://webr3.org/nathan#me>
 * @version 2010-06-22T16:55:00Z
 * @license http://creativecommons.org/publicdomain/zero/1.0/
 * 
 * source: <http://github.com/webr3/URI>
 * To the extent possible under law, <http://webr3.org/nathan#me>
 * has waived all copyright and related or neighboring rights to
 * this work.
 */

/**
 * URI Class
 * 
 * @constructor
 * @extends String
 * @param {String} value
 * @requires URI.HeirPart
 * @requires URI.Authority
 * @requires URI.Path
 * @return void
 */
(URI = function( value ) {
	this.value = value;
	this.length = value.length;
	String.call( this , value );
}).prototype = {
  __proto__: String.prototype,
  value: '', length: 0,
  toString: function() { return this.value.toString(); },
  valueOf: function() { return this.value; },
  /**
   * @member URI
   * @return {URI} The URI with any fragment removed
   */
  defrag: function() {
  	var i = this.indexOf("#");
  	if (i < 0) return this;
  	return new URI( this.slice( 0, i ) );
  },
  /**
   * @member URI
   * @return {String} The scheme of this URI or null if schemeless
   */
  scheme: function() {
  	var scheme = this.match(/^[a-z0-9\-\+\.]+:/i);
  	if (scheme == null ) return null;
  	return scheme.shift();
  },
  /**
   * @member URI
   * @return {URI.HeirPart} The heir-part of this URI containing authority and path
   */
  heirpart: function() {
  	var heirpart = this.value;
  	var q = heirpart.indexOf("?")
  	if( q >= 0 ) {
  		heirpart = heirpart.substring(0,q);
  	} else {
  		q = heirpart.indexOf("#")
  		if( q >= 0 ) {
  			heirpart = heirpart.substring(0,q);
  		}
  	}
  	q = this.scheme();
  	if( q ) {
  		heirpart = heirpart.slice( q.length );
  	}
  	return new URI.HeirPart(heirpart);
  },
  /**
   * @member URI
   * @return {String} The query of the URI or null if no query
   */
  querystring: function() {
  	var q = this.indexOf("?");
  	if (q < 0) return null;
  	var f = this.indexOf("#");
  	if (f < 0) return this.slice(q);
  	return this.substring( q , f );
  },
  /**
   * @member URI
   * @return {String} The fragment of the URI or null if no fragment
   */
  fragment: function() {
  	var i = this.indexOf("#");
  	if (i < 0) return null;
  	return this.slice( i );
  },
  /**
   * @member URI
   * @return {Boolean} True if the URI is an Absolute URI
   */
  isAbsolute: function() {
  	return this.scheme() != null && this.heirpart() != null && this.fragment() == null;
  },
  /**
   * @member URI
   * @return {URI} A normalised Absolute URI with paths resolved and fragment removed
   */
  toAbsolute: function() {
  	if( this.scheme() == null || this.heirpart() == null ) throw 'URI must have a scheme and a hierpart.';
  	var out = this.resolveReference( this );
  	return out.defrag();
  },
  /**
   * Implementation of remove-dot-segments from rfc3986
   * 
   * @private
   * @member URI
   * @param {String} input 
   * @return {String}
   */
  removeDotSegments: function( input ) {
  	var output = '';
  	var q = null;
  	while( input.length > 0 ) {
  		if( input.substr(0,3) == '../' || input.substr(0,2) == './' ) {
  			input = input.slice(input.indexOf('/'));
  		} else if( input == '/.' ) {
  			input = '/';
  		} else if( input.substr(0,3) == '/./'  ) {
  			input = input.slice(2);
  		} else if( input.substr(0,4) == '/../' || input == '/..' ) {
  			if( input == '/..' ) {
  				input = '/';
  			} else {
  				input = input.slice(3);
  			}
  			q = output.lastIndexOf('/');
  			if( q ) {
  				output = output.substring(0,q);
  			} else {
  				output = '';
  			}
  		} else if( input.substr(0,2) == '..' || input.substr(0,1) == '.' ) {
  			input = input.slice(input.indexOf('.'));
  			q = input.indexOf('.');
  			if(q) {
  				input = input.slice(q);
  			}
  		} else {
  			if( input.substr(0,1) == '/' ) {
  				output += '/';
  				input = input.slice(1);
  			}
  			q = input.indexOf('/');
  			if( q < 0 ) {
  				output += input;
  				input = '';
  			} else {
  				output += input.substring(0,q);
  				input = input.slice(q);
  			}
  		}
  	}
  	return output;
  },
  /**
   * Implementation of Reference Resolution from rfc3986
   * Resolves a URI Reference using the current instance as Base URI
   * 
   * @member URI
   * @param {String} reference The URI Reference to resolve
   * @return {URI} Resolved URI Reference
   */
  resolveReference: function( reference ) {
  	if(typeof reference == 'string') {
  		reference = new URI(reference);
  	}
  	if( !(reference instanceof URI ) ) {
  		throw 'Expected an URI or a String';
  	}
  	var T = { scheme:'',authority:'',path:'',query:'',fragment:''};
  	var q = null;
  	if( reference.scheme() ) {
  		T.scheme = reference.scheme();
  		q = reference.heirpart().authority();
  		T.authority += q ? '//' + q : '';
  		T.path = this.removeDotSegments( reference.heirpart().path() );
  		q = reference.querystring();
  		T.query += q ? q : '';
  	} else {
  		q = reference.heirpart().authority();
  		if( q ) {
  			T.authority = q ? '//' + q : '';
  			T.path = this.removeDotSegments( reference.heirpart().path() );
  			q = reference.querystring();
  			T.query += q ? q : '';
  		} else {
  			q = reference.heirpart().path();
  			if( q == "" ) {
  				T.path = this.heirpart().path();
  				q = reference.querystring();
  				if( q ) {
  					T.query += q ? q : '';
  				} else {
  					q = this.querystring();
  					T.query += q ? q : ''; 
  				}
  			} else {
  				if( q.substring(0,1) == '/' ) {
  					T.path = this.removeDotSegments( q );
  				} else {
  					if( this.heirpart().path() ) {
  						q = this.heirpart().path().lastIndexOf('/');
  						if( q ) {
  							T.path = this.heirpart().path().substring(0,++q);
  						}
  						T.path += reference.heirpart().path();
  					} else {
  						T.path = '/' + q;
  					}
  					T.path = this.removeDotSegments( T.path );
  				}
  				q = reference.querystring();
  				T.query += q ? q : ''; 
  			}
  			q = this.heirpart().authority();
  			T.authority = q ? '//' + q : '';
  		}
  		T.scheme = this.scheme();
  	}
  	q = reference.fragment();
  	T.fragment = q ? q : '';
  	return new URI( T.scheme + T.authority + T.path + T.query + T.fragment );
  }
};
/**
 * URI.HeirPart
 * 
 * @constructor
 * @extends String
 * @param {String} value
 * @return void
 */
(URI.HeirPart = function( value ) {
	this.value = value;
	this.length = value.length;
	String.call( this , value );
}).prototype = {
  __proto__: String.prototype,
  toString: function() { return this.value.toString(); },
  valueOf: function() { return this.value; },
  /**
   * @member URI.HeirPart
   * @return URI.Authority The Authority of the URI or null
   */
  authority: function() {
  	if( '//' != this.substring(0,2) ) {
  		return null;
  	}
  	var authority = this.slice(2);
  	var q = authority.indexOf('/');
  	if( q >= 0 ) {
  		authority = authority.substr(0,q);
  	}
  	return new URI.Authority(authority);
  },
  /**
   * @member URI.HeirPart
   * @return URI.Path The Path of the URI
   */
  path: function() {
  	var q = this.authority();
  	if( !q ) return new URI.Path(this);
  	return new URI.Path( this.slice(q.length + 2) );
  }
};

/**
 * URI.Authority
 * 
 * @constructor
 * @extends String
 * @param {String} value
 * @return void
 */
(URI.Authority = function( value ) {
	this.value = value;
	this.length = value.length;
	String.call( this , value );
}).prototype = {
  __proto__: String.prototype,
  toString: function() { return this.value.toString(); },
  valueOf: function() { return this.value; },
  /**
   * @member URI.Authority
   * @return String The user-info of the URI or null
   */
  userinfo: function() {
  	var q = this.indexOf("@");
  	if(q < 0) return null;
  	return this.substr(0,q);
  },
  /**
   * @member URI.Authority
   * @return String The host of the URI, one of ipv4, ipv6, ipvFuture or reg-name
   */
  host: function() {
  	var host = this.value;
  	// check if userinfo and remove
  	var q = host.indexOf("@");
  	if(q >= 0) host = host.slice(++q);
  	// check if ipv6 or ipfuture
  	if( host.indexOf("[") == 0 ) {
  		q = host.indexOf("]");
  		if( q > 0 ) return host.substring(0,++q);
  	}
  	// check if we have a port and remove
  	q = host.lastIndexOf(":");
  	if( q >= 0 ) return host.substring(0,q);
  	return host;
  },
  /**
   * @member URI.Authority
   * @return String The port of the URI or null
   */
  port: function() {
  	var port = this.value;
  	// remove user and pass
  	var q = port.indexOf("@");
  	if(q >= 0) port = port.slice(q);
  	// strip ipv6 or ipfuture if we have one
  	if( port.indexOf("[") == 0 ) {
  		q = port.indexOf("]");
  		if( q > 0 ) port = port.slice(q);
  	}
  	// check if we have a port return
  	q = port.lastIndexOf(":");
  	if( q < 0 ) {
  		return null;
  	}
  	port = port.slice(++q);
  	return ( port.length == 0 ) ? null : port;	
  }
};

/**
 * URI.Path
 * 
 * @constructor
 * @extends String
 * @param {String} value
 * @return void
 */
(URI.Path = function( value ) {
	this.value = value;
	this.length = value.length;
	String.call( this , value );
}).prototype = {
  __proto__: String.prototype,
  toString: function() { return this.value.toString(); },
  valueOf: function() { return this.value; }
};

module.exports = URI;