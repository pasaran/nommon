var parser = require( './no.jparser.js' );
var runtime = require( './no.jruntime.js' );

var jcompile = require( './no.jcompile.js' );

var _compiled_jsetters = {};

var jsetter = function( jpath ) {
    return compile_setter( jpath, 'set' );
};

jsetter.delete = function( jpath ) {
    return compile_setter( jpath, 'delete' );
};

var ARRAY_METHODS = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
];

ARRAY_METHODS.forEach( function( method ) {
    jsetter[ method ] = function( jpath ) {
        return compile_setter( jpath, method );
    };
} );

function compile_setter( jpath, method ) {
    var key = jpath + '#' + method;
    var compiled = _compiled_jsetters[ key ];
    if ( compiled ) {
        return compiled;
    }

    var ast = parser.parse( jpath, 'jpath' );

    var exprs = [];

    var js = '';

    var steps = ast.steps;
    if ( ARRAY_METHODS.indexOf( method ) !== -1 ) {
        steps.push( {
            _id: 'array_method',
            method: method,
        } );
    }

    for ( var i = 0, l = steps.length; i < l; i++ ) {
        var step = steps[ i ];

        var is_last = ( i === l - 1 );
        var step_js;
        switch ( step._id ) {
            case 'namestep':
                step_js = ( is_last ) ?
                    'R.sn_' + method + '(d,x,"' + step.name + '")' :
                    'R.sn(d,r,v,x,"' + step.name + '",s' + ( i + 1 ) + ')';

                break;

            case 'pred':
                var exid = jcompile.expr2func( step.expr, exprs );
                step_js = ( is_last ) ?
                    'R.sp_' + method + '(d,x,e' + exid + ')' :
                    'R.sp(d,r,v,x,e' + exid + ',s' + ( i + 1 ) + ')';

                break;

            case 'index':
                var exid = jcompile.expr2func( step.expr, exprs );
                step_js = ( is_last ) ?
                    'R.si_' + method + '(d,x,e' + exid + ')' :
                    'R.si(d,r,v,x,e' + exid + ',s' + ( i + 1 ) + ')';

                break;

            case 'array_method':
                step_js = 'R.am(d,x,"' + method + '")';

                break;
        }

        js += 'function s' + i + '(d,r,v,x){return ' + step_js + '}\n';
    }

    js += jcompile.exprs2js( exprs );

    js += 'return s0';

    //  console.log( js );

    compiled = _compiled_jsetters[ key ] = Function( 'R', js )( runtime );

    return compiled;
}

module.exports = jsetter;

