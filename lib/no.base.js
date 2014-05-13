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
no.error = function( message ) {
    //  TODO
    console.log( arguments );
    throw Error( message );
};

//  ---------------------------------------------------------------------------------------------------------------  //

