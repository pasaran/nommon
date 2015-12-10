var no = no || require( './no.base.js' );

if ( no.de ) {
    require( './no.events.js' );

    module.exports = no;
}

( function() {

//  ---------------------------------------------------------------------------------------------------------------  //

var STATUS_PENDING = 0;
var STATUS_RESOLVED = 1;
var STATUS_REJECTED = 2;

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise = function() {
    this._status = STATUS_PENDING;
    this._value = null;

    this._dones = new Callbacks();
    this._fails = new Callbacks();
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.extend( no.Promise.prototype, no.Events );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype.is_pending = function() {
    return this._status === STATUS_PENDING;
};

no.Promise.prototype.is_resolved = function() {
    return this._status === STATUS_RESOLVED;
};

no.Promise.prototype.is_rejected = function() {
    return this._status === STATUS_REJECTED;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype.then = function( done, fail ) {
    var promise = no.promise();

    if ( this.is_resolved() ) {
        var value = this._value;

        if ( typeof done === 'function' ) {
            no.next_tick( function() {
                resolve_promise_with_value( promise, done( value) );
            } );

        } else {
            promise.resolve( value );
        }

    } else if ( this.is_rejected() ) {
        var value = this._value;

        if ( typeof fail === 'function' ) {
            no.next_tick( function() {
                resolve_promise_with_value( promise, fail( value ) );
            } );

        } else {
            promise.reject( value );
        }

    } else {
        if ( typeof done === 'function' ) {
            this._dones.add( function( value ) {
                resolve_promise_with_value( promise, done( value ) )
            } );

        } else {
            this._dones.add( function( value ) {
                promise.resolve( value );
            } );
        }

        if ( typeof fail === 'function' ) {
            this._fails.add( function( value ) {
                resolve_promise_with_value( promise, fail( value) )
            } );

        } else {
            this._fails.add( function( value ) {
                promise.reject( value );
            } );
        }
    }

    return promise;
};

function resolve_promise_with_value( promise, value ) {
    if ( no.is_promise( value ) ) {
        if ( value.is_resolved() ) {
            promise.resolve( value._value );

        } else if ( value.is_rejected() ) {
            promise.reject( value._value );

        } else {
            value.pipe( promise );
        }

    } else if ( no.is_error( value ) ) {
        promise.reject( value );

    } else {
        promise.resolve( value );
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype.done = function( done ) {
    return this.then( done );
};

no.Promise.prototype.fail = function( fail ) {
    return this.then( null, fail );
};

no.Promise.prototype.always = function( always ) {
    return this.then( always, always );
};

no.Promise.prototype.pipe = function( promise ) {
    return this.then(
        function( value ) {
            promise.resolve( value );
        },
        function( value ) {
            promise.reject( value );
        }
    );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype.resolve = function( value ) {
    if ( this.is_pending() ) {
        this._status = STATUS_RESOLVED;
        this._value = value;

        this._dones.run( value );

        this._dones = null;
        this._fails = null;
    }

    return this;
};

no.Promise.prototype.reject = function( value ) {
    if ( this.is_pending() ) {
        this._status = STATUS_REJECTED;
        this._value = value;

        this._fails.run( value );

        this._dones = null;
        this._fails = null;
    }

    return this;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.promise = function() {
    return new no.Promise();
};

no.promise.resolved = function( value ) {
    return no.promise().resolve( value );
};

no.promise.rejected = function( value ) {
    return no.promise().reject( value );
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
            promise.then(
                function( value ) {
                    results[ i ] = value;
                    if ( !--n ) {
                        all.resolve( results );
                    }
                },
                function( value ) {
                    all.reject( value );
                }
            );
        } )( array[ i ], i );
    }

    return all;
}

function all_object( object ) {
    var all = no.promise();

    var results = {};

    var array = [];
    for ( var key in object ) {
        ( function( promise, key ) {
            promise.then( function( value ) {
                results[ key ] = value;
            } );

            array.push( promise );
        } )( object[ key ], key );
    }

    all_array( array ).then(
        function() {
            all.resolve( results );
        },
        function( value ) {
            all.reject( value );
        }
    );

    return all;
}

//  ---------------------------------------------------------------------------------------------------------------  //

var Callbacks = function() {
    this._n = 0;
    this._callbacks = null;
}

Callbacks.prototype.add = function( callback ) {
    var n = this._n;

    if ( n === 0 ) {
        this._callbacks = callback;
        this._n = 1;

    } else if ( n === 1 ) {
        this._callbacks = [ this._callbacks, callback ];
        this._n = 2;

    } else {
        this._callbacks.push( callback );
        this._n++;
    }
};

Callbacks.prototype.run = function( value ) {
    var n = this._n;
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

no.is_promise = function( something ) {
    return ( something instanceof no.Promise );
};

//  ---------------------------------------------------------------------------------------------------------------  //

})();

