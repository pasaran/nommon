var no = require( './no.base' );

var parser = require( './no.jparser' );
var runtime = require( './no.jruntime' );
var jcompile = require( './no.jcompile' );

//  ---------------------------------------------------------------------------------------------------------------  //

no.jpath = function( jpath, data, vars ) {
    return no.jpath.expr( jpath )( data, data, vars );
};

no.jpath.expr = function( expr ) {
    var type = typeof expr;

    if ( type === 'string' ) {
        return compile( expr, 'expr' );

    } else if ( type === 'function' ) {
        return expr;

    } else if ( expr && type === 'object' ) {
        return ( Array.isArray( expr ) ) ? compile_array( expr ) : compile_object( expr );

    } else {
        return function() {
            return expr;
        };
    }
};

no.jpath.string = function( expr ) {
    return compile( expr, 'string_content' );
};

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_object( object ) {
    var items = {};

    for ( var key in object ) {
        items[ key ] = no.jpath.expr( object[ key ] );
    }

    //  FIXME: Компилировать сразу в функцию без цикла?
    return function( data, root, vars ) {
        var r = {};

        for ( var key in items ) {
            r[ key ] = items[ key ]( data, root, vars );
        }

        return r;
    };
}

function compile_array( array ) {
    var items = [];

    var l = array.length;
    for ( var i = 0; i < l; i++ ) {
        items.push( no.jpath.expr( array[ i ] ) );
    }

    //  FIXME: Компилировать сразу в функцию без цикла?
    return function( data, root, vars ) {
        var r = [];

        for ( var i = 0; i < l; i++ ) {
            r.push( items[ i ]( data, root, vars ) );
        }

        return r;
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

var _compiled_jpaths = {};

function compile( expr, id ) {
    var key = expr + '::' + id;

    var compiled = _compiled_jpaths[ key ];
    if ( !compiled ) {
        var ast = parser.parse( expr, id );

        //  no.inspect( ast );

        var exprs = [];
        var exid = ( ast._id === 'jpath' ) ? jcompile.jpath2func( ast, exprs ) : jcompile.expr2func( ast, exprs );

        var js = jcompile.exprs2js( exprs ) + 'return e' + exid;
        //  console.log( js );

        compiled = _compiled_jpaths[ key ] = Function( 'R', js )( runtime );
    }

    return compiled;
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

