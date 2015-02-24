var no = no || require( './no.base.js' );

if ( no.de ) {
    require( './no.string.js' );

    module.exports = no;
}

( function() {

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
        //  FIXME: Разобраться с http://jsperf.com/knopsh-token-closure-vs-token-function
        //  Непонятно, как таки быстрее парсить токен-строку.
        //
        return Function(
            'parser',
            'return ( parser.s.substr( parser.x, ' + token.length + ') === ' + JSON.stringify( token ) + ') ? ' + JSON.stringify( token ) + ': null;'
        );
    }

    if ( type === 'function' ) {
        return token;
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.parse = function( s, id ) {
    this.s = s;
    this.l = s.length;
    this.x = 0;

    var ast = this.match( id );

    if ( !this.is_eol() ) {
        this.error( 'Expected end of line' );
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
        this.error( 'Token %token expected', { token: id } );
    }

    this.move( r.length );

    return r;
};

no.Parser.prototype.is_eol = function() {
    return this.x >= this.l;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.next = function( n ) {
    return this.s.substr( this.x, n );
};

no.Parser.prototype.next_char = function() {
    return this.s.charAt( this.x );
};

no.Parser.prototype.next_code = function() {
    return this.s.charCodeAt( this.x );
};

no.Parser.prototype.move = function( n ) {
    this.x += n;
};

//  http://jsperf.com/skip-spaces-regexp-vs-charat
//
no.Parser.prototype.skip = function() {
    var s = this.s;
    var l = this.l;
    var x = this.x;

    if ( x >= l || s.charCodeAt( x ) !== 32 ) {
        return;
    }

    var i = x + 1;
    while ( i < l && s.charCodeAt( i ) === 32 ) {
        i++;
    }

    this.x = i;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.error = function( msg, params ) {
    var where = this.s + '\n' + no.string.repeat( ' ', this.x ) + '^';
    params = no.extend( {}, params || {}, { where: where } );

    no.error( msg + '\n%where', params );
};

//  ---------------------------------------------------------------------------------------------------------------  //

} )();

