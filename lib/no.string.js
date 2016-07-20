var no = require( './no.base.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

no.string = {};

//  ---------------------------------------------------------------------------------------------------------------  //

no.string.repeat = function( string, n ) {
    if ( !n ) {
        return '';
    }

    string = string.toString();

    //  FIXME: Померять. Может лучше if, или вообще без этого блока.
    switch ( n ) {
        case 1:
            return string;
        case 2:
            return string + string;
        case 3:
            return string + string + string;
    }

    var result = '';

    while ( n > 1 ) {
        if ( n & 1 ) {
            result += string;
        }
        string += string;
        n >>= 1;
    }

    return result + string;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.string.pad_left = function( string, n, ch ) {
    string = string.toString();

    if ( n === 0 ) {
        return string;
    }

    var l = n - string.length;
    if ( l <= 0 ) {
        return string;
    }

    ch = ch || ' ';

    //  FIXME: Померять. Может лучше if, или вообще без этого блока.
    switch ( l ) {
        case 1:
            return ch + string;
        case 2:
            return ch + ch + string;
    }

    return no.string.repeat( ch, l ) + string;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.string.group_sep = function( string, group_len, group_sep, direction ) {
    string = string.toString();

    var l = string.length;
    if ( l <= group_len ) {
        return string;
    }

    group_sep = group_sep || ' ';
    direction = direction || 1;

    var r;
    var i;
    if ( direction === 1 ) {
        r = string.substr( 0, group_len );
        i = group_len;

    } else {
        //  Если длина строки нацело делится на group_len,
        //  то начинаем не с k равного 0, а с k равного group_len,
        //  чтобы в цикле ниже не добавить лишнего разделителя в начале.
        //
        var k = l % group_len || group_len;
        r = string.substr( 0, k );
        i = k;
    }

    while ( i < l ) {
        r += group_sep + string.substr( i, group_len );
        i += group_len;
    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.string.format = function( s ) {
    //  TODO:
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

