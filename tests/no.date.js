var no = require( '../lib/no.date.js' );

var expect = require( 'expect.js' );

var dates = [
    new Date( '2015-06-09T13:53:44' ),
    new Date( '2015-06-19T13:53:44' ),
];

describe( 'format date', function() {

    it( '%B %d, %Y', function() {
        expect( no.date.format( '%B %d, %Y', dates[0] ) ).to.be( 'June 09, 2015' );
    } );

    it( '%d %h %Y', function() {
        expect( no.date.format( '%d %h %Y', dates[0] ) ).to.be( '09 Jun 2015' );
        expect( no.date.format( '%d %h %Y', dates[0], 'ru' ) ).to.be( '09 июня 2015' );
    } );

    it( '%B %e, %Y', function() {
        expect( no.date.format( '%B %e, %Y', dates[0] ) ).to.be( 'June 9, 2015' );
        expect( no.date.format( '%B %e, %Y', dates[1] ) ).to.be( 'June 19, 2015' );
    } );

} );

