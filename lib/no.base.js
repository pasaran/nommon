var no = no || require( './no.js' );

if ( no.de ) {
    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.inherit = function( ctor, base, mixin ) {
    var F = function() {};
    F.prototype = base.prototype;
    var proto = ctor.prototype = new F();

    if ( mixin ) {
        if ( Array.isArray( mixin ) ) {
            for ( var i = 0, l = mixin.length; i < l; i++ ) {
                no.extend( proto, mixin[ i ] );
            }
        } else {
            no.extend( proto, mixin );
        }
    }

    proto.super_ = base.prototype;
    proto.constructor = ctor;

    return ctor;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.extend = function( dest ) {
    for ( var i = 1, l = arguments.length; i < l; i++ ) {
        var src = arguments[ i ];
        for ( var key in src ) {
            dest[ key ] = src[ key ];
        }
    }

    return dest;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.op = function() {};

no.true = function() { return true; };
no.false = function() { return false; };

//  FIXME: Убрать.
no.value = function( value ) {
    return function() {
        return value;
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Унести в какой-нибудь no.debug.js.
//
//      no.error( 'Token %s expected. Found: %s!', 'ID', '(' );
//
no.error = function( message, args ) {
    if ( !Array.isArray( args ) ) {
        args = [].slice.call( arguments, 1 );
    }

    //  FIXME: Сделать какой-нибудь no.printf?
    //  FIXME: Как-то отдельно обрабатывать %s, %d, ...?
    //  Сейчас они просто подставляют соответствующий аргумент.
    var parts = message.split( /(%[a-z])/g );

    var error = parts[ 0 ];
    for ( var i = 0, l = ( parts.length - 1 ) / 2; i < l; i++ ) {
        error += args[ i ] || '';
        error += parts[ ( i + 1 ) * 2 ];
    }

    throw Error( error );
};

//  ---------------------------------------------------------------------------------------------------------------  //

