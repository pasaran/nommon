var no = require( './no.base.js' );

require( './no.promise.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Future = function( future ) {
    this.future = future;
};

no.Future.prototype.run = function( params ) {
    return this.future( params );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.future = function( future ) {
    return new no.Future( future );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.is_future = function( something ) {
    return ( something instanceof no.Future );
};

no.is_runable = function( something ) {
    return ( something && typeof something.run === 'function' );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.future.wait = function() {
    var futures = arguments;

    return new no.Future( function( params ) {
        var promises = [];

        for ( var i = 0, l = futures.length; i < l; i++ ) {
            var future = futures[ i ];

            var promise = future.run( params );
            if ( promise ) {
                promises.push( promise );
            }
        }

        return no.promise( promises );
    } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.future.seq = function() {
    var futures = arguments;
    var l = futures.length;

    return new no.Future( function( params ) {
        var promise = new no.Promise();

        run( promise, 0, params );

        return promise;
    } );

    function run( promise, i, params ) {
        var future = futures[ i ];

        future.run( params )
            .done( function( result ) {
                if ( i + 1 < l ) {
                    run( promise, i + 1, result );

                } else {
                    promise.resolve( result );
                }
            } )
            .fail( function( error ) {
                promise.reject( error );
            } );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

