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

no.Promise.prototype.then = function( done, fail ) {
    var promise = new no.Promise();

    if ( this._status === STATUS_RESOLVED ) {
        if ( done ) {
            var value = this._value;

            no.next_tick( function() {
                run_callback_with_value( done, value, promise, 'resolve' );
            } );
        }

    } else if ( this._status === STATUS_REJECTED ) {
        if ( fail ) {
            var value = this._value;

            no.next_tick( function() {
                run_callback_with_value( fail, value, promise, 'reject' );
            } );
        }

    } else {
        if ( done ) {
            this._dones.add( function( value ) {
                run_callback_with_value( done, value, promise, 'resolve' )
            } );
        }

        if ( fail ) {
            this._fails.add( function( value ) {
                run_callback_with_value( fail, value, promise, 'reject' )
            } );
        }
    }

    return promise;
};

function run_callback_with_value( callback, value, promise, method ) {
    var a_value = callback( value );

    if ( a_value !== undefined ) {
        if ( a_value instanceof no.Promise ) {
            if (a_value._status === STATUS_RESOLVED ) {
                promise.resolve( a_value._value );

            } else if ( a_value._status === STATUS_REJECTED ) {
                promise.reject( a_value._value );

            } else {
                a_value.pipe( promise );
            }

        } else {
            promise[ method ]( a_value );
        }

    } else {
        promise[ method ]( value );
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
    if ( this._status === STATUS_PENDING ) {
        this._status = STATUS_RESOLVED;
        this._value = value;

        this._dones.run( value );

        this._dones = null;
        this._fails = null;
    }

    return this;
};

no.Promise.prototype.reject = function( value ) {
    if ( this._status === STATUS_PENDING ) {
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
    return ( new no.Promise() ).resolve( value );
};

no.promise.rejected = function( value ) {
    return ( new no.Promise() ).reject( value );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.promise.wait = function( promises ) {
    return ( Array.isArray( promises ) ) ? wait_array( promises ) : wait_object( promises );
};

function wait_array( array ) {
    var wait = new no.Promise();

    var results = [];

    var l = array.length;
    if ( l === 0 ) {
        return wait.resolve( results );
    }

    var n = l;
    for ( var i = 0; i < l; i++ ) {
        ( function( promise, i ) {
            promise.then(
                function( value ) {
                    results[ i ] = value;
                    if ( !--n ) {
                        wait.resolve( results );
                    }
                },
                function( value ) {
                    wait.reject( value );
                }
            );
        } )( array[ i ], i );
    }

    return wait;
}

function wait_object( object ) {
    var wait = new no.Promise();

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

    wait_array( array ).then(
        function() {
            wait.resolve( results );
        },
        function( value ) {
            wait.reject( value );
        }
    );

    return wait;
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

    } else if ( n > 1 ) {
        no.next_tick( function() {
            for ( var i = 0; i < n; i++ ) {
                callbacks[ i ]( value );
            }
        } );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

})();

