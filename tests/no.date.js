var no = require( '../lib/no.date.js' );

var expect = require( 'expect.js' );

var date = new Date( '2015-06-09T13:53:44' );

describe( 'format date', function() {

    it( '%B %d, %Y', function() {
        expect( no.date.format( '%B %d, %Y', date ) ).to.be( 'June 09, 2015' );
    } );

    it( '%d %h %Y', function() {
        expect( no.date.format( '%d %h %Y', date ) ).to.be( '09 Jun 2015' );
        expect( no.date.format( '%d %h %Y', date, 'ru' ) ).to.be( '09 июня 2015' );
    } );

} );

