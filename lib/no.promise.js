var no = require( './no.base' );

require( './no.events' );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise = function( init ) {
    this._resolved = false;
    this._value = null;
    this._n_callbacks = 0;
    this._callbacks = null;

    if ( init ) {
        init.call( this );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.extend( no.Promise.prototype, no.Events );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype.get_value = function() {
    return this._value;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype.is_pending = function() {
    return !this._resolved;
};

no.Promise.prototype.is_resolved = function() {
    return this._resolved;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype.then = function( done ) {
    var promise = no.promise();

    if ( this._resolved ) {
        var value = this._value;
        no.next_tick( function() {
            resolve_promise_with_value( promise, done( value ) );
        } );

    } else {
        this._add_callback( function( value ) {
            resolve_promise_with_value( promise, done( value ) );
        } );
    }

    return promise;
};

function resolve_promise_with_value( promise, value ) {
    if ( no.is_promise( value ) ) {
        if ( value._resolved ) {
            promise.resolve( value._value );

        } else {
            value.pipe( promise );
        }

    } else {
        promise.resolve( value );
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype._add_callback = function( callback ) {
    var n = this._n_callbacks;

    if ( n === 0 ) {
        this._callbacks = callback;
        this._n_callbacks = 1;

    } else if ( n === 1 ) {
        this._callbacks = [ this._callbacks, callback ];
        this._n_callbacks = 2;

    } else {
        this._callbacks.push( callback );
        this._n_callbacks++;
    }
};

no.Promise.prototype._run_callbacks = function( value ) {
    var n = this._n_callbacks;
    if ( !n ) {
        return;
    }

    var callbacks = this._callbacks;

    if ( n === 1 ) {
        no.next_tick( function() {
            callbacks( value );
        } );

    } else if ( n === 2 ) {
        no.next_tick( function() {
            callbacks[ 0 ]( value );
            callbacks[ 1 ]( value );
        } );

    } else {
        no.next_tick( function() {
            for ( var i = 0; i < n; i++ ) {
                callbacks[ i ]( value );
            }
        } );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype.pipe = function( promise ) {
    this.then( function( value ) {
        promise.resolve( value );
    } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype.resolve = function( value ) {
    if ( !this._resolved ) {
        this._resolved = true;
        this._value = value;

        this._run_callbacks( value );

        this._callbacks = null;
    }

    return this;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype.abort = function( reason ) {
    if ( !this._resolved ) {
        this.trigger( 'abort', reason );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.promise = function( init ) {
    return new no.Promise( init );
};

no.promise.resolved = function( value ) {
    return no.promise().resolve( value );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.promise.all = function( promises ) {
    return ( Array.isArray( promises ) ) ? all_array( promises ) : all_object( promises );
};

function all_array( array ) {
    var all = no.promise();

    var results = [];

    var l = array.length;
    if ( l === 0 ) {
        return all.resolve( results );
    }

    var n = l;
    for ( var i = 0; i < l; i++ ) {
        ( function( promise, i ) {
            promise.then( function( value ) {
                results[ i ] = value;
                if ( !--n ) {
                    all.resolve( results );
                }
            } );
        } )( array[ i ], i );
    }

    return all;
}

function all_object( object ) {
    var all = no.promise();

    var keys = [];
    var promises = [];
    for ( var key in object ) {
        keys.push( key );
        promises.push( object[ key ] );
    }

    all_array( promises )
        .then( function( values ) {
            var result = {};
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                result[ keys[ i ] ] = values[ i ];
            }
            all.resolve( result );
        } );

    return all;
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.promise.maybe = function( promises ) {
    return ( Array.isArray( promises ) ) ? maybe_array( promises ) : maybe_object( promises );
};

function maybe_array( array ) {
    var all = no.promise();

    var results = [];

    var l = array.length;
    if ( l === 0 ) {
        return all.resolve( results );
    }

    var n = l;
    var done = false;
    for ( var i = 0; i < l; i++ ) {
        ( function( promise, i ) {
            promise.then( function( value ) {
                if ( done ) {
                    return;
                }

                if ( no.is_error( value ) ) {
                    all.resolve( value );
                    done = true;

                } else {
                    results[ i ] = value;
                    if ( !--n ) {
                        all.resolve( results );
                    }
                }
            } );
        } )( array[ i ], i );
    }

    return all;
}

function maybe_object( object ) {
    var all = no.promise();

    var keys = [];
    var promises = [];
    for ( var key in object ) {
        keys.push( key );
        promises.push( object[ key ] );
    }

    maybe_array( promises )
        .then( function( values ) {
            if ( no.is_error( values ) ) {
                all.resolve( values );

            } else {
                var result = {};
                for ( var i = 0, l = keys.length; i < l; i++ ) {
                    result[ keys[ i ] ] = values[ i ];
                }
                all.resolve( result );
            }
        } );

    return all;
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.is_promise = function( something ) {
    return ( something instanceof no.Promise );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

