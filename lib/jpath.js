var parser = require( './no.jparser.js' );
var runtime = require( './no.jruntime.js' );

var jcompile = require( './no.jcompile.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var jget = function( jpath, data, vars ) {
    return jget.expr( jpath )( data, data, vars );
};

jget.expr = function( expr ) {
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

jget.string = function( expr ) {
    return compile( expr, 'string_content' );
};

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_object( object ) {
    var items = {};

    for ( var key in object ) {
        items[ key ] = jget.expr( object[ key ] );
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
        items.push( jget.expr( array[ i ] ) );
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

        compiled = Function( 'R', js )( runtime );
    }

    return compiled;
}

/*
function exprs2js( exprs ) {
    var js = '';

    for ( var i = 0, l = exprs.length; i < l; i++ ) {
        js += 'function e' + i + '(d,r,v){' + exprs[ i ] + '}\n';
    }

    return js;
}
*/

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = jget;

