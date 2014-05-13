//  Работа с future:
//
//      var no = require( './no.future.js' );
//
//      var f1 = new no.Future( function( params ) {
//          var promise = new no.Promise();
//
//          setTimeout( function() {
//              console.log( params );
//              promise.resolve( params + 1 );
//          }, 1000 );
//
//          return promise;
//      } );
//
//      no.future.wait(
//          no.future.seq( f1, f1, f1 ),
//          no.future.seq( f1, f1, f1, f1 )
//      ).run( 1 )
//          .done( function( result ) {
//              console.log( result );
//          } );
//

//  ---------------------------------------------------------------------------------------------------------------  //

var no = no || require('./no.base.js');

if  ( no.de ) {
    require('./no.promise.js');

    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.Future = function( future ) {
    if ( future instanceof no.Future || typeof future.run === 'function' ) {
        return future;
    }

    this.future = future;
};

no.Future.prototype.run = function( params ) {
    return this.future( params );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.future = {};

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

