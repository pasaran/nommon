var no = require( './no.base' );

require( './no.string' );

//  ---------------------------------------------------------------------------------------------------------------  //

no.number = {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Примеры:
//
//      //  4 цифры после запятой.
//      no.number.format( 1.2, 4 ) === '1.2000'
//
//      //  Разделять группы чисел пробелами.
//      no.number.format( 1000000, null, ' ' ) === '1 000 000'
//
//      //  Использовать запятую вместо точки.
//      no.number.format( 1.2, null, null, ',' ) === '1,2'
//
no.number.format = function( number, digits, sep, point ) {
    if ( typeof number !== 'number' ) {
        return '';
    }

    var r = ( digits != null ) ? number.toFixed( digits ) : number.toString();

    if ( sep ) {
        var parts = r.split( '.' );

        parts[ 0 ] = no.string.group_sep( parts[ 0 ], 3, sep, -1 );

        r = parts.join( point || '.' );

    } else if ( point ) {
        r = r.replace( '.', point );
    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

