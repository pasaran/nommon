var no = no || require( './no.base.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser = function( grammar ) {
    this._rules = grammar.rules || {};

    var tokens = grammar.tokens || {};
    var compiled = this._tokens = {};

    for ( var id in tokens ) {
        var token = tokens[ id ];

        compiled[ id ] = compile_token( token );
    }
};

function compile_token( token ) {
    var type = typeof token;

    if ( type === 'string' ) {
        var l = token.length;

        return function( parser ) {
            return ( parser.s.substr( 0, l ) === token ) ? token : null;
        };
    }

    if ( type === 'function' ) {
        return token;
    }

    //  token is regexp.
    return function( parser ) {
        var r = token.exec( parser.s );

        return r && r[ 0 ];
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.parse = function( s, id ) {
    this.s = s;

    var ast = this.match( id );

    if ( this.s ) {
        this.error( 'End of string expected' );
    }

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.match = function( id, params ) {
    var rule = this._rules[ id ];

    var ast = rule( this, params );

    return ast;
};

no.Parser.prototype.is_token = function( id ) {
    var token = this._tokens[ id ];

    return token( this );
};

no.Parser.prototype.token = function( id ) {
    var r = this.is_token( id );

    if ( !r ) {
        this.error( 'Token %s expected', id );
    }

    this.move( r.length );

    return r;
};


//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.next = function( n ) {
    return this.s.substr( 0, n );
};

no.Parser.prototype.next_char = function() {
    return this.s.charAt( 0 );
};

no.Parser.prototype.next_code = function() {
    return this.s.charCodeAt( 0 );
};

no.Parser.prototype.move = function( n ) {
    this.s = this.s.substr( n );
};

//  http://jsperf.com/skip-spaces-regexp-vs-charat
//
no.Parser.prototype.skip = function() {
    var s = this.s;

    if ( s.charCodeAt( 0 ) !== 32 ) {
        return;
    }

    var i = 1;
    var l = s.length;
    while ( i < l && s.charCodeAt( i ) === 32 ) {
        i++;
    }

    this.move( i );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.error = function( msg ) {
    var args = [].slice.call( arguments, 1 );
    args.push( this.s )

    no.error( msg + ': %s', args );
};

//  ---------------------------------------------------------------------------------------------------------------  //

