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

var util_ = require( 'util' );

no.inspect = function( obj ) {
    console.log( util_.inspect( obj, { depth: null, colors: true } ) );
};

//  FIXME: Унести в какой-нибудь no.debug.js.
//
//      no.error( 'Token "%expected" expected. Found: "%found", {
//          expected: 'ID',
//          found: '('
//      } );
//
no.error = function( message, params ) {
    params = params || {};

    var error = message.replace( /%(\w+)/g, function( _, name ) {
        return params[ name ] || '';
    } );

    throw Error( error );
};

//  ---------------------------------------------------------------------------------------------------------------  //

if ( no.de ) {
    no.next = function( callback ) {
        process.nextTick( callback );
    };
} else if ( typeof requestAnimationFrame === 'function' ) {
    no.next = function( callback ) {
        requestAnimationFrame( callback );
    };
} else {
    no.next = function( callback ) {
        setTimeout( callback, 0 );
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

