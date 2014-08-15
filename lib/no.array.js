var no = no || require( './no.base.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

no.array = function( value ) {
    if ( value === undefined ) {
        return [];
    }

    return ( Array.isArray( value ) ) ? value : [ value ];
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.array.map = function( array, callback ) {
    var r = [];

    for ( var i = 0, l = array.length; i < l; i++ ) {
        var value = callback( array[ i ], i );

        if ( value !== undefined ) {
            r.push( value );
        }
    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.array.uniq = function( array ) {
    var l = array.length;

    if ( l < 2 ) {
        return array;
    }

    var result = [ array[ 0 ] ];
    for ( var i = 1; i < l; i++ ) {
        var item = array[ i ];
        if ( result.indexOf( item ) === -1 ) {
            result.push( item );
        }
    }

    return result;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.array.union = function( array ) {
    for ( var i = 1, l = arguments.length; i < l; i++ ) {
        array = array.concat( arguments[ i ] );
    }

    return no.array.uniq( array );
};

//  ---------------------------------------------------------------------------------------------------------------  //

