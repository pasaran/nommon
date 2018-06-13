var no = require( './no.base' );

var parser = require( './no.jparser' );
var runtime = require( './no.jruntime' );
var jcompile = require( './no.jcompile' );

var _compiled_jsetters = {};

//  ---------------------------------------------------------------------------------------------------------------  //

no.jsetter = function( jpath ) {
    return compile_setter( jpath, 'set' );
};

no.jsetter.delete = function( jpath ) {
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
    no.jsetter[ method ] = function( jpath ) {
        return compile_setter( jpath, method );
    };
} );

//  ---------------------------------------------------------------------------------------------------------------  //

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

    var is_array_method = ( ARRAY_METHODS.indexOf( method ) !== -1 );

    if ( is_array_method ) {
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
                if ( is_last ) {
                    if ( method === 'set' ) {
                        step_js = 'R.sns(d,x,"' + step.name + '")';

                    } else if ( method === 'delete' ) {
                        step_js = 'R.snd(d,"' + step.name + '")';
                    }

                } else {
                    step_js = 'R.sn(d,r,v,x,"' + step.name + '",s' + ( i + 1 ) + ')';
                }

                break;

            case 'pred':
                var exid = jcompile.expr2func( step.expr, exprs );
                if ( is_last ) {
                    if ( method === 'set' ) {
                        step_js = 'R.sps(d,r,v,x,e' + exid + ')';

                    } else if ( method === 'delete' ) {
                        step_js = 'R.spd(d,r,v,e' + exid + ')';
                    }

                } else {
                    step_js = 'R.sp(d,r,v,x,e' + exid + ',s' + ( i + 1 ) + ')';
                }

                break;

            case 'index':
                var exid = jcompile.expr2func( step.expr, exprs );
                if ( is_last ) {
                    if ( method === 'set' ) {
                        step_js = 'R.sis(d,r,v,x,e' + exid + ')';

                    } else {
                        step_js = 'R.sid(d,r,v,e' + exid + ')';
                    }

                } else {
                    step_js = 'R.si(d,r,v,x,e' + exid + ',s' + ( i + 1 ) + ')';
                }

                break;

            case 'array_method':
                step_js = 'R.sa(d,"' + method + '",x)';

                break;
        }

        js += 'function s' + i + '(d,r,v,x){return ' + step_js + '}\n';
    }

    js += jcompile.exprs2js( exprs );

    js += 'return s0';

    //  console.log( js );

    compiled = Function( 'R', js )( runtime );
    var r;
    if ( is_array_method ) {
        r = function( data, vars ) {
            var args = [].slice.call( arguments, 2 );
            return compiled( data, data, vars, args );
        };

    } else {
        r = function( data, vars, value ) {
            return compiled( data, data, vars, value );
        };
    }

    _compiled_jsetters[ key ] = r;

    return r;
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

