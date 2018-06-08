/* eslint-env mocha */

const jsetter = require( '../lib/jsetter' );

const expect = require( 'expect.js' );

describe( 'jsetter', function() {

    it( '.foo.bar', function() {
        const data = {
            foo: {
                bar: 42,
            },
        };

        const r = jsetter( '.foo.bar' )( data, data, null, 24 );

        expect( r ).to.be.eql( { foo: { bar: 24 } } );
        expect( r ).not.to.be( data );
        expect( r.foo ).not.to.be( data.foo );
    } );

} );

