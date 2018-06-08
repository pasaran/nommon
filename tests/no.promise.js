/* eslint-env mocha */

var no = require( '../lib/index.js' );

var expect = require( 'expect.js' );

var ERROR_ID = 'PROMISE_ERROR';

describe( 'promises', function() {

    it( 'init promise', function( done ) {
        no.promise( function() {
            setTimeout( () => this.resolve( 42 ), 50 );
        } )
            .then( function( value ) {
                expect( value ).to.be( 42 );

                done();
            } );
    } );

    it( 'resolve with a value', function( done ) {
        var promise = no.promise();

        setTimeout( function() {
            promise.resolve( 42 );
        }, 50 );

        promise.then( function( value ) {
            expect( value ).to.be( 42 );

            done();
        } );
    } );

    it( 'resolve with an error', function( done ) {
        no.promise( function() {
            setTimeout( () => this.resolve( no.error( ERROR_ID ) ) );
        } )
            .then( function( value ) {
                expect( value ).to.be.a( no.Error );
                expect( value.error ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'callback called in next tick', function( done ) {
        var promise = no.promise();

        var a;
        promise.then( function() {
            expect( a ).to.be( 42 );

            done();
        } );
        promise.resolve();
        a = 42;
    } );

    it( 'multiple resolve with a value', function( done ) {
        var promise = no.promise();

        var a;
        promise.then( function( value ) {
            a = value;
        } );
        promise.resolve( 42 );
        promise.resolve( 24 );

        setTimeout( function() {
            expect( a ).to.be( 42 );

            done();
        }, 50 );
    } );

    it( 'resolve with a value then resolve with an error', function( done ) {
        var promise = no.promise();

        var a;
        promise.then( function( value ) {
            a = value;
        } );
        promise.resolve( 42 );
        promise.resolve( no.error( ERROR_ID ) );

        setTimeout( function() {
            expect( a ).to.be( 42 );

            done();
        }, 50 );
    } );

    it( 'resolve with an error then resolve with a value', function( done ) {
        var promise = no.promise();

        var a;
        promise.then( function( value ) {
            a = value;
        } );
        promise.resolve( no.error( ERROR_ID ) );
        promise.resolve( 42 );

        setTimeout( function() {
            expect( a ).to.be.a( no.Error );
            expect( a.error ).to.be( ERROR_ID );

            done();
        }, 50 );
    } );

    it( 'multiple resolve with an error', function( done ) {
        var promise = no.promise();

        var a;
        promise.then( function( value ) {
            a = value;
        } );
        promise.resolve( no.error( `${ ERROR_ID }_1` ) );
        promise.resolve( no.error( `${ ERROR_ID }_2` ) );

        setTimeout( function() {
            expect( a ).to.be.a( no.Error );
            expect( a.error ).to.be( `${ ERROR_ID }_1` );

            done();
        }, 50 );
    } );

    it( 'resolve before then', function( done ) {
        var promise = no.promise();

        promise.resolve( 42 );
        promise.then( function( value ) {
            expect( value ).to.be( 42 );

            done();
        } );
    } );

    it( 'callback returns a value', function( done ) {
        var promise = no.promise();

        promise
            .then( function( value ) {
                expect( value ).to.be( 42 );

                return 24;
            } )
            .then( function( value ) {
                expect( value ).to.be( 24 );

                done();
            } );
        promise.resolve( 42 );
    } );

    it( 'callback returns an error', function( done ) {
        var promise = no.promise();

        promise
            .then( function() {
                return no.error( ERROR_ID );
            } )
            .then( function( value ) {
                expect( value ).to.be.a( no.Error );
                expect( value.error ).to.be( ERROR_ID );

                done();
            } );
        promise.resolve();
    } );

    it( 'callback returns a promise', function( done ) {
        var promise = no.promise();

        promise
            .then( function() {
                return no.promise( function() {
                    setTimeout( () => this.resolve( 42 ), 50 );
                } );
            } )
            .then( function( value ) {
                expect( value ).to.be( 42 );

                done();
            } );
        promise.resolve();
    } );

    it( 'callback returns promise resolved with a value', function( done ) {
        var promise = no.promise();

        promise
            .then( function() {
                return no.promise.resolved( 42 );
            } )
            .then( function( value ) {
                expect( value ).to.be( 42 );

                done();
            } );
        promise.resolve();
    } );

    it( 'no.promise.all( array )', function( done ) {
        var p1 = no.promise( function() {
            setTimeout( () => this.resolve( 42 ), 50 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => this.resolve( 24 ), 100 );
        } );

        no.promise.all( [ p1, p2 ] )
            .then( function( value ) {
                expect( value ).to.be.eql( [ 42, 24 ] );

                done();
            } );
    } );

    it( 'no.promise.all( array ), first promise returns an error', function( done ) {
        var p1 = no.promise( function() {
            setTimeout( () => this.resolve( no.error( ERROR_ID ) ), 50 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => this.resolve( 24 ), 100 );
        } );

        no.promise.all( [ p1, p2 ] )
            .then( function( value ) {
                expect( value.length ).to.be( 2 );
                expect( value[ 0 ] ).to.be.a( no.Error );
                expect( value[ 0 ].error ).to.be( ERROR_ID );
                expect( value[ 1 ] ).to.be( 24 );

                done();
            } );
    } );

    it( 'no.promise.all( array ), second promise returns an error', function( done ) {
        var p1 = no.promise( function() {
            setTimeout( () => this.resolve( 42 ), 50 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => this.resolve( no.error( ERROR_ID ) ), 100 );
        } );

        no.promise.all( [ p1, p2 ] )
            .then( function( value ) {
                expect( value.length ).to.be( 2 );
                expect( value[ 0 ] ).to.be( 42 );
                expect( value[ 1 ] ).to.be.a( no.Error );
                expect( value[ 1 ].error ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'no.promise.maybe( array )', function( done ) {
        var p1 = no.promise( function() {
            setTimeout( () => this.resolve( 42 ), 50 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => this.resolve( 24 ), 100 );
        } );

        no.promise.maybe( [ p1, p2 ] )
            .then( function( value ) {
                expect( value ).to.be.eql( [ 42, 24 ] );

                done();
            } );
    } );

    it( 'no.promise.maybe( array ), first promise returns an error', function( done ) {
        var v1;
        var v2;
        var p1 = no.promise( function() {
            setTimeout( () => {
                v1 = true;
                this.resolve( no.error( ERROR_ID ) );
            }, 50 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => {
                v2 = true;
                this.resolve( 24 );
            }, 100 );
        } );

        no.promise.maybe( [ p1, p2 ] )
            .then( function( value ) {
                expect( v1 ).to.be( true );
                expect( v2 ).to.be( undefined );
                expect( value ).to.be.a( no.Error );
                expect( value.error ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'no.promise.maybe( array ), second promise returns an error', function( done ) {
        var p1 = no.promise( function() {
            setTimeout( () => {
                this.resolve( 42 );
            }, 50 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => {
                this.resolve( no.error( ERROR_ID ) );
            }, 100 );
        } );

        no.promise.maybe( [ p1, p2 ] )
            .then( function( value ) {
                expect( value ).to.be.a( no.Error );
                expect( value.error ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'no.promise.all( object )', function( done ) {
        var p1 = no.promise( function() {
            setTimeout( () => this.resolve( 42 ), 100 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => this.resolve( 24 ), 50 );
        } );

        no.promise.all( { foo: p1, bar: p2 } )
            .then( function( value ) {
                expect( value ).to.be.eql( { foo: 42, bar: 24 } );
                expect( Object.keys( value ) ).to.be.eql( [ 'foo', 'bar' ] );

                done();
            } );
    } );

    it( 'no.promise.all( object ), first promise returns an error', function( done ) {
        var p1 = no.promise( function() {
            setTimeout( () => {
                this.resolve( no.error( ERROR_ID ) );
            }, 50 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => {
                this.resolve( 24 );
            }, 100 );
        } );

        no.promise.all( { foo: p1, bar: p2 } )
            .then( function( value ) {
                expect( value.foo ).to.be.a( no.Error );
                expect( value.foo.error ).to.be( ERROR_ID );
                expect( value.bar ).to.be( 24 );

                done();
            } );
    } );

    it( 'no.promise.all( object ), second promise returns an error', function( done ) {
        var p1 = no.promise( function() {
            setTimeout( () => {
                this.resolve( 42 );
            }, 50 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => {
                this.resolve( no.error( ERROR_ID ) );
            }, 100 );
        } );

        no.promise.all( { foo: p1, bar: p2 } )
            .then( function( value ) {
                expect( value.foo ).to.be( 42 );
                expect( value.bar ).to.be.a( no.Error );
                expect( value.bar.error ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'no.promise.maybe( object )', function( done ) {
        var p1 = no.promise( function() {
            setTimeout( () => this.resolve( 42 ), 100 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => this.resolve( 24 ), 50 );
        } );

        no.promise.maybe( { foo: p1, bar: p2 } )
            .then( function( value ) {
                expect( value ).to.be.eql( { foo: 42, bar: 24 } );
                expect( Object.keys( value ) ).to.be.eql( [ 'foo', 'bar' ] );

                done();
            } );
    } );

    it( 'no.promise.maybe( object ), first promise returns an error', function( done ) {
        var v1;
        var v2;
        var p1 = no.promise( function() {
            setTimeout( () => {
                v1 = true;
                this.resolve( 42 );
            }, 100 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => {
                v2 = true;
                this.resolve( no.error( ERROR_ID ) );
            }, 50 );
        } );

        no.promise.maybe( { foo: p1, bar: p2 } )
            .then( function( value ) {
                expect( v1 ).to.be( undefined );
                expect( v2 ).to.be( true );
                expect( value ).to.be.a( no.Error );
                expect( value.error ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'no.promise.maybe( object ), second promise returns an error', function( done ) {
        var p1 = no.promise( function() {
            setTimeout( () => {
                this.resolve( no.error( ERROR_ID ) );
            }, 100 );
        } );
        var p2 = no.promise( function() {
            setTimeout( () => {
                this.resolve( 24 );
            }, 50 );
        } );

        no.promise.maybe( { foo: p1, bar: p2 } )
            .then( function( value ) {
                expect( value ).to.be.a( no.Error );
                expect( value.error ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'promise.all in next next tick', function( done ) {
        var p1 = no.promise();
        var p2 = no.promise();
        var p = no.promise.all( [ p1, p2 ] );

        var foo;
        p.then( function() {
            foo = true;
        } );

        p1.resolve( 42 );
        p2.resolve( 24 );

        no.next_tick( function() {
            expect( p.is_resolved() ).to.be( true );
            expect( foo ).to.be( undefined );

            no.next_tick( function() {
                expect( foo ).to.be( true );

                done();
            } );
        } );
    } );

} );

