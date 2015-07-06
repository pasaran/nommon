var no = require( '../lib/no.number.js' );

var expect = require( 'expect.js' );

describe( 'no.number.format', function() {

    it( 'no.number.format', function() {
        expect( no.number.format( 1.3579 ) ).to.be( '1.3579' );
        expect( no.number.format( 1.3579, 1 ) ).to.be( '1.4' );
        expect( no.number.format( 1.2345, 1 ) ).to.be( '1.2' );
        expect( no.number.format( 1.3579, 2 ) ).to.be( '1.36' );
        expect( no.number.format( 1.3579, 3 ) ).to.be( '1.358' );

        expect( no.number.format( 100.12, 0 ) ).to.be( '100' );
        expect( no.number.format( 100.89, 0 ) ).to.be( '101' );
        //  По сути `no.number.format( n, null ) === n.toString()`.
        expect( no.number.format( 100.12, null ) ).to.be( '100.12' );
        expect( no.number.format( 100.89, null ) ).to.be( '100.89' );

        expect( no.number.format( 1.3579, null, null, ',' ) ).to.be( '1,3579' );

        expect( no.number.format( 100, null, ' ' ) ).to.be( '100' );
        expect( no.number.format( 1000, null, ' ' ) ).to.be( '1 000' );
        expect( no.number.format( 10000, null, ' ' ) ).to.be( '10 000' );
        expect( no.number.format( 100000, null, ' ' ) ).to.be( '100 000' );
        expect( no.number.format( 1000000, null, ' ' ) ).to.be( '1 000 000' );
        expect( no.number.format( 123456789, null, ' ' ) ).to.be( '123 456 789' );

        expect( no.number.format( 1000000.3, 2, ' ' ) ).to.be( '1 000 000.30' );
    } );

} );

