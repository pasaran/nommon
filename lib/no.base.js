var no = require( './no.js' );

if ( no.de ) {
    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.inherit = function( ctor, base, mixin ) {
    var F = function() {
        //  Empty.
    };
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
        if ( src ) {
            for ( var key in src ) {
                var value = src[ key ];
                if ( value !== undefined ) {
                    dest[ key ] = value;
                }
            }
        }
    }

    return dest;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.op = function() {
    //  Do nothing.
};

no.true = function() {
    return true;
};

no.false = function() {
    return false;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Унести в какой-нибудь no.debug.js.
//
//      no.throw( 'Token "%expected" expected. Found: "%found", {
//          expected: 'ID',
//          found: '('
//      } );
//
no.throw = function( message, params ) {
    params = params || {};

    var error = message.replace( /%(\w+)/g, function( _, name ) {
        return params[ name ] || '';
    } );

    throw Error( error );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Error = function( error ) {
    this.error = error;
};

no.error = function( error ) {
    return new no.Error( error );
};

no.is_error = function( something ) {
    return ( something instanceof no.Error || something instanceof Error );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Stolen from https://github.com/petkaantonov/bluebird and https://github.com/dfilatov/vow.
//
no.next_tick = ( function() {
    if ( no.de ) {
        return ( typeof setImmediate === 'function' ) ? setImmediate : process.nextTick;
    }

    if ( typeof MutationObserver !== 'undefined' ) {
        var callbacks = [];
        var enqueue = function( callback ) {
            //  Returns true for the first enqueued callback.
            return callbacks.push( callback ) === 1;
        };
        var run = function() {
            var _callbacks = callbacks;
            callbacks = [];

            for ( var i = 0, l = _callbacks.length; i < l; i++ ) {
                _callbacks[ i ]();
            }
        };

        var div = document.createElement( 'div' );
        new MutationObserver( run ).observe( div, { attributes: true } );

        return function( callback ) {
            if ( enqueue( callback ) ) {
                div.classList.toggle( 'x' );
            }
        };
    }

    if ( typeof setImmediate === 'function' ) {
        return setImmediate;
    }

    return function( callback ) {
        setTimeout( callback, 0 );
    };

} )();

//  ---------------------------------------------------------------------------------------------------------------  //

