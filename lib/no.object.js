var no = require( './no.base.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

no.object = {};

//  ---------------------------------------------------------------------------------------------------------------  //

no.object.map = function( object, callback ) {
    var r = {};

    for ( var key in object ) {
        var value = callback( object[ key ], key );

        if ( value !== undefined ) {
            r[ key ] = value;
        }
    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.object.is_empty = function( object ) {
    //  eslint-disable-next-line no-unused-vars
    for ( var key in object ) {
        return false;
    }

    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

