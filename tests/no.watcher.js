var no = require( '../lib/no.watcher.js' );

var expect = require( 'expect.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

it( 'get/set', function() {
    var watcher = new no.Watcher();

    watcher.add( 'foo', { value: 42 } );

    expect( watcher.get( 'foo' ) ).to.be( 42 );

    watcher.set( 'foo', 24 );
    expect( watcher.get( 'foo' ) ).to.be( 24 );
} );

//  ---------------------------------------------------------------------------------------------------------------  //

it( 'change:foo', function() {
    var watcher = new no.Watcher();

    var n = 0;
    watcher.on( 'change:foo', function() {
        n++;
    } );

    watcher.add( 'foo', { value: 42 } );

    watcher.once( 'change:foo', function( e, params ) {
        expect( params.value ).to.be( 24 );
    } );
    watcher.set( 'foo', 24 );
    watcher.set( 'foo', 24 );
    watcher.set( 'foo', 24 );

    watcher.once( 'change:foo', function( e, params ) {
        expect( params.value ).to.be( 42 );
    } );
    watcher.set( 'foo', 42 );

    expect( n ).to.be( 2 );
} );

//  ---------------------------------------------------------------------------------------------------------------  //

it( 'change and multiple set', function() {
    var watcher = new no.Watcher();

    watcher.add( 'foo', { value: 42 } );
    watcher.add( 'bar', { value: 24 } );

    watcher.once( 'change', function( e, params ) {
        expect( params ).to.be.eql( {
            foo: {
                value: 77,
                old_value: 42
            }
        } );
    } );
    watcher.set( 'foo', 77 );

    watcher.once( 'change', function( e, params ) {
        expect( params ).to.be.eql( {
            foo: {
                value: 42,
                old_value: 77
            },
            bar: {
                value: 36,
                old_value: 24
            }
        } );
    } );
    watcher.set( {
        foo: 42,
        bar: 36
    } );
} );

//  ---------------------------------------------------------------------------------------------------------------  //

it( 'computed values', function() {
    var watcher = new no.Watcher();

    watcher.add( 'foo', { value: 42 } );
    watcher.add( 'bar', { value: 24 } );

    watcher.add( 'quu', {
        expr: 'foo + bar',
        deps: [ 'foo', 'bar' ]
    } );
    expect( watcher.get( 'quu' ) ).to.be( 66 );

    watcher.once( 'change:quu', function( e, params ) {
        expect( params ).to.be.eql( {
            value: 58,
            old_value: 66
        } );
    } );
    watcher.set( {
        foo: 36,
        bar: 22
    } );
    expect( watcher.get( 'quu' ) ).to.be( 58 );
} );

//  ---------------------------------------------------------------------------------------------------------------  //

it( 'no changes', function() {
    var watcher = new no.Watcher();

    watcher.add( 'foo', { value: 42 } );
    watcher.add( 'bar', { value: 24 } );

    var n = 0;
    watcher.on( 'change', function() {
        n++;
    } );

    watcher.set( 'foo', 42 );
    watcher.set( 'bar', 24 );
    watcher.set( {
        foo: 42
    } );
    watcher.set( {
        foo: 42,
        bar: 24
    } );

    expect( n ).to.be( 0 );
} );

//  ---------------------------------------------------------------------------------------------------------------  //

