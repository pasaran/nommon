var no = require( '../lib/no.string.js' );

var expect = require( 'expect.js' );

describe( 'no.string.repeat', function() {

    it( 'no.string.repeat', function() {
        expect( no.string.repeat( ' ' ) ).to.be( '' );
        expect( no.string.repeat( ' ', 0 ) ).to.be( '' );
        expect( no.string.repeat( ' ', 1 ) ).to.be( ' ' );
        expect( no.string.repeat( ' ', 2 ) ).to.be( '  ' );
        expect( no.string.repeat( ' ', 3 ) ).to.be( '   ' );
        expect( no.string.repeat( ' ', 10 ) ).to.be( '          ' );

        expect( no.string.repeat( 4 ) ).to.be( '' );
        expect( no.string.repeat( 4, 7 ) ).to.be( '4444444' );
    } );

} );

describe( 'no.string.pad_left', function() {

    it( 'no.string.pad_left', function() {
        expect( no.string.pad_left( '123' ) ).to.be( '123' );
        expect( no.string.pad_left( '123', 0 ) ).to.be( '123' );
        expect( no.string.pad_left( '123', 1 ) ).to.be( '123' );
        expect( no.string.pad_left( '123', 2 ) ).to.be( '123' );
        expect( no.string.pad_left( '123', 3 ) ).to.be( '123' );
        expect( no.string.pad_left( '123', 4 ) ).to.be( ' 123' );
        expect( no.string.pad_left( '123', 8 ) ).to.be( '     123' );

        expect( no.string.pad_left( 123 ) ).to.be( '123' );
        expect( no.string.pad_left( 123, 8 ) ).to.be( '     123' );

        expect( no.string.pad_left( '1234', 16, '*' ) ).to.be( '************1234' );
    } );

} );

describe( 'no.string.group_sep', function() {

    it( 'no.string.group_sep', function() {
        expect( no.string.group_sep( 1234567890, 3 ) ).to.be( '123 456 789 0' );
        expect( no.string.group_sep( 1234567890, 3, ' ', -1 ) ).to.be( '1 234 567 890' );

        expect( no.string.group_sep( '', 3 ) ).to.be( '' );
        expect( no.string.group_sep( '1', 3 ) ).to.be( '1' );
        expect( no.string.group_sep( '12', 3 ) ).to.be( '12' );
        expect( no.string.group_sep( '123', 3 ) ).to.be( '123' );
        expect( no.string.group_sep( '1234', 3 ) ).to.be( '123 4' );
        expect( no.string.group_sep( '12345', 3 ) ).to.be( '123 45' );
        expect( no.string.group_sep( '123456', 3 ) ).to.be( '123 456' );
        expect( no.string.group_sep( '1234567', 3 ) ).to.be( '123 456 7' );
        expect( no.string.group_sep( '12345678', 3 ) ).to.be( '123 456 78' );
        expect( no.string.group_sep( '123456789', 3 ) ).to.be( '123 456 789' );
        expect( no.string.group_sep( '1234567890', 3 ) ).to.be( '123 456 789 0' );

        expect( no.string.group_sep( '', 3, ' ', -1 ) ).to.be( '' );
        expect( no.string.group_sep( '1', 3, ' ', -1 ) ).to.be( '1' );
        expect( no.string.group_sep( '12', 3, ' ', -1 ) ).to.be( '12' );
        expect( no.string.group_sep( '123', 3, ' ', -1 ) ).to.be( '123' );
        expect( no.string.group_sep( '1234', 3, ' ', -1 ) ).to.be( '1 234' );
        expect( no.string.group_sep( '12345', 3, ' ', -1 ) ).to.be( '12 345' );
        expect( no.string.group_sep( '123456', 3, ' ', -1 ) ).to.be( '123 456' );
        expect( no.string.group_sep( '1234567', 3, ' ', -1 ) ).to.be( '1 234 567' );
        expect( no.string.group_sep( '12345678', 3, ' ', -1 ) ).to.be( '12 345 678' );
        expect( no.string.group_sep( '123456789', 3, ' ', -1 ) ).to.be( '123 456 789' );
        expect( no.string.group_sep( '1234567890', 3, ' ', -1 ) ).to.be( '1 234 567 890' );

        expect( no.string.group_sep( '************1234', 4 ) ).to.be( '**** **** **** 1234' );
        expect( no.string.group_sep( '1234234534564567', 4, '-' ) ).to.be( '1234-2345-3456-4567' );
    } );

} );

