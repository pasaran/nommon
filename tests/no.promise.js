var no = require( '../lib/no.promise.js' );

var expect = require( 'expect.js' );

describe( 'core features', function() {

    it( 'resolve', function( done ) {
        var promise = no.promise();

        promise.then( function( value ) {
            expect( value ).to.be( 42 );
            done();
        } );

        setTimeout( function() {
            promise.resolve( 42 );
        }, 50 );
    } );

    it( 'reject', function( done ) {
        var promise = no.promise();

        promise.fail( function( value ) {
            expect( value ).to.be( 42 );
            done();
        } );

        setTimeout( function() {
            promise.reject( 42 );
        }, 50 );
    } );

    it( 'multiple resolve', function( done ) {
        var promise = no.promise();

        var a = [];

        promise.then( function( value ) {
            a.push( value );
        } );

        setTimeout( function() {
            promise.resolve( 42 );
            setTimeout( function() {
                promise.resolve( 24 );
            }, 50 );
        }, 50 );

        setTimeout( function() {
            expect( a ).to.be.eql( [ 42 ] );
            done();
        }, 200 );
    } );

    it( 'resolve then reject', function( done ) {
        var promise = no.promise();

        var a1 = [];
        var a2 = [];

        promise.then(
            function( value ) {
                a1.push( value );
            },
            function( value ) {
                a2.push( value );
            }
        );

        setTimeout( function() {
            promise.resolve( 42 );
            setTimeout( function() {
                promise.reject( 24 );
            }, 50 );
        }, 50 );

        setTimeout( function() {
            expect( a1 ).to.be.eql( [ 42 ] );
            expect( a2 ).to.be.eql( [] );
            done();
        }, 200 );
    } );

    it( 'resolve callback in next tick', function( done ) {
        var promise = no.promise();

        var a = [];

        promise.then( function( value ) {
            a.push( value );
        } );

        promise.resolve( 42 );
        a.push( 24 );

        setTimeout( function() {
            expect( a ).to.be.eql( [ 24, 42 ] );
            done();
        }, 50 );
    } );

    it( 'resolve before then', function( done ) {
        var promise = no.promise();

        var a = [];

        promise.resolve( 42 );
        a.push( 24 );

        promise.then( function( value ) {
            a.push( value );

            expect( a ).to.be.eql( [ 24, 42 ] );
            done();
        } );
    } );

    it( 'resolve callback returns value', function( done ) {
        var promise = no.promise();

        var a = [];

        promise
            .then( function( value ) {
                a.push( value );

                return value + 1;
            } )
            .then( function( value ) {
                a.push( value );

                expect( a ).to.be.eql( [ 42, 43 ] );
                done();
            } );

        promise.resolve( 42 );
    } );

    it( 'resolve callback returns promise', function( done ) {
        var promise = no.promise();

        var a = [];

        promise
            .then( function( value ) {
                a.push( value );

                var promise = no.promise();

                setTimeout( function() {
                    promise.resolve( value + 1 );
                }, 50 );

                return promise;
            } )
            .then( function( value ) {
                a.push( value );

                expect( a ).to.be.eql( [ 42, 43 ] );
                done();
            } );

        promise.resolve( 42 );
    } );

    it( 'resolve callback returns resolved promise', function( done ) {
        var promise = no.promise();

        var a = [];

        promise
            .then( function( value ) {
                a.push( value );

                return no.promise.resolved( value + 1 );
            } )
            .then( function( value ) {
                a.push( value );

                expect( a ).to.be.eql( [ 42, 43 ] );
                done();
            } );

        promise.resolve( 42 );
    } );

    it( 'array of promises. resolve', function( done ) {
        var p1 = no.promise();
        var p2 = no.promise();

        no.promise.wait( [ p1, p2 ] )
            .then( function( value ) {
                expect( value ).to.be.eql( [ 42, 24 ] );
                done();
            } );

        setTimeout( function() {
            p1.resolve( 42 );
        }, 50 );
        setTimeout( function() {
            p2.resolve( 24 );
        }, 100 );
    } );

    it( 'array of promises. reject', function( done ) {
        var p1 = no.promise();
        var p2 = no.promise();

        no.promise.wait( [ p1, p2 ] )
            .fail( function( value ) {
                expect( value ).to.be.eql( 42 );
                done();
            } );

        setTimeout( function() {
            p1.reject( 42 );
        }, 50 );
        setTimeout( function() {
            p2.reject( 24 );
        }, 100 );
    } );

    it( 'object of promises. resolve', function( done ) {
        var p1 = no.promise();
        var p2 = no.promise();

        no.promise.wait( { foo: p1, bar: p2 } )
            .then( function( value ) {
                expect( value ).to.be.eql( { foo: 42, bar: 24 } );
                done();
            } );

        setTimeout( function() {
            p1.resolve( 42 );
        }, 50 );
        setTimeout( function() {
            p2.resolve( 24 );
        }, 100 );
    } );

    it( 'object of promises. reject', function( done ) {
        var p1 = no.promise();
        var p2 = no.promise();

        no.promise.wait( { foo: p1, bar: p2 } )
            .fail( function( value ) {
                expect( value ).to.be.eql( 42 );
                done();
            } );

        setTimeout( function() {
            p1.reject( 42 );
        }, 50 );
        setTimeout( function() {
            p2.reject( 24 );
        }, 100 );
    } );

} );

