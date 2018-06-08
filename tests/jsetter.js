/* eslint-env mocha */

const jsetter = require( '../lib/jsetter' );

const expect = require( 'expect.js' );

describe( 'jsetter', function() {

    it( '.a.b', function() {
        const data = {
            a: {
                b: 42,
            },
            c: {
                d: 66,
            },
        };

        const r = jsetter( '.a.b' )( data, data, null, 24 );

        expect( r ).to.be.eql( {
            a: {
                b: 24
            },
            c: {
                d: 66,
            },
        } );
        expect( r ).not.to.be( data );
        expect( r.a ).not.to.be( data.a );
        expect( r.c ).to.be( data.c );
    } );

} );

