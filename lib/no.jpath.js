var no = require( './no.base.js' );

require( './no.parser.js' );

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

var parser = require( './no.jparser.js' );
var runtime = require( './no.jruntime.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _compiled_jpaths = {};

function compile( expr, id ) {
    var key = expr + '::' + id;

    var compiled = _compiled_jpaths[ key ];
    if ( !compiled ) {
        var ast = parser.parse( expr, id );

        //  no.inspect( ast );

        var exprs = [];
        var exid = ( ast._id === 'jpath' ) ? jpath2func( ast, exprs ) : expr2func( ast, exprs );

        var js = exprs2js( exprs ) + 'return e' + exid;
        //  console.log( js );

        compiled = Function( 'R', js )( runtime );
    }

    return compiled;
}

function exprs2js( exprs ) {
    var js = '';

    for ( var i = 0, l = exprs.length; i < l; i++ ) {
        js += 'function e' + i + '(d,r,v){' + exprs[ i ] + '}\n';
    }

    return js;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function expr2func( ast, exprs ) {
    var js = 'return(' + ast2js( ast, exprs ) + ');';

    return exprs.push( js ) - 1;
}

function jpath2func( ast, exprs ) {
    var js = ( ast.abs ) ? 'd=r;' : '';

    var steps = ast.steps;
    for ( var i = 0, l = steps.length; i < l; i++ ) {
        var step = steps[ i ];

        switch ( step._id ) {
            case 'namestep':
                js += 'if(!d)return;d=R.gn(d,"' + step.name + '");';

                break;

            case 'starstep':
                js += 'if(!d)return;d=R.gs(d,[]);';

                break;

            case 'pred':
                js += 'd=R.gp(d,r,v,e' + expr2func( step.expr, exprs ) + ');';

                break;

            case 'index':
                var exid = expr2func( step.expr, exprs );
                js += 'if(!d)return;d=R.gi(d,r,v,e' + exid + ');';

                break;
        }
    }

    js += 'return d';

    return exprs.push( js ) - 1;
}

//  ---------------------------------------------------------------------------------------------------------------  //

var _compiled_jsetters = {};

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
                var exid = expr2func( step.expr, exprs );
                step_js = ( is_last ) ?
                    'R.sp_' + method + '(d,x,e' + exid + ')' :
                    'R.sp(d,r,v,x,e' + exid + ',s' + ( i + 1 ) + ')';

                break;

            case 'index':
                var exid = expr2func( step.expr, exprs );
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

    js += exprs2js( exprs );

    js += 'return s0';

    //  console.log( js );

    compiled = _compiled_jsetters[ key ] = Function( 'R', js )( runtime );

    return compiled;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function ast2js( ast, exprs ) {
    var js;

    switch ( ast._id ) {
        case 'root':
            js = 'r';

            break;

        case 'self':
            js = 'd';

            break;

        case 'number':
            js = ast.value;

            break;

        case 'string_literal':
            js = JSON.stringify( ast.value );

            break;

        case 'string':
            js = '(""';
            var content = ast.value;
            for ( var i = 0, l = content.length; i < l; i++ ) {
                var item = content[ i ];
                var item_js = ast2js( item, exprs );
                js += '+R.ts(' + item_js + ')';
            }
            js += ')';

            break;

        case 'ternary':
            js = '((' + ast2js( ast.condition, exprs ) + ')?' +
                ast2js( ast.then, exprs ) + ':' +
                ast2js( ast.else, exprs ) + ')';

            break;

        case 'unop':
            js = ast.op + '(' + ast2js( ast.expr, exprs ) + ')';

            break;

        case 'binop':
            var op = ast.op;
            var left_js = ast2js( ast.left, exprs );
            var right_js = ast2js( ast.right, exprs );

            if ( op === '~~' ) {
                js = 'R.c(' + left_js + ',' + right_js + ')';

            } else if ( op === '!~' ) {
                js = '!R.c(' + left_js + ',' + right_js + ')';

            } else if ( op === '+' || op === '-' || op === '*' || op === '/' || op === '%' ) {
                left_js = 'R.tn(' + left_js + ')';
                right_js = 'R.tn(' + right_js + ')';

            } else if ( op === '<' || op === '<=' || op === '>' || op === '>=' ) {
                left_js = 'R.tc(' + left_js + ')';
                right_js = 'R.tc(' + right_js + ')';
            }

            if ( !js ) {
                js = left_js + op + right_js;
            }

            break;

        case 'subexpr':
            js = '(' + ast2js( ast.expr, exprs ) + ')';

            break;

        case 'jpath':
            var exid = jpath2func( ast, exprs );
            js = 'e' + exid + '(d,r,v)';

            break;

        case 'var':
            js = 'v["' + ast.name + '"]';

            break;

        /*
        case 'func':
            var name = ast.name;

            var scheme = _external_schemes[ name ];
            if ( !scheme ) {
                no.throw( 'Function %name() not defined', { name: name } );
            }

            js = 'e["' + name + '"](';
            var args = ast.args;
            for ( var i = 0, l = args.length; i < l; i++ ) {
                if ( i ) {
                    js += ',';
                }
                js += ast2js( args[ i ], d_scheme, r_scheme, exprs );
            }
            //  FIXME: Тут нужно сматчить подходящий метод по имени и сигнатуре.
            //  NOTE: Делать это нужно после цикла, чтобы у всех аргументов был проставлен тип.

            js += ')';

            ast._scheme = scheme;

            break;
        */

        case 'filter':
            var exid = jpath2func( ast.jpath, exprs );
            js = 'e' + exid + '(' + ast2js( ast.expr, exprs ) + ',r,v)';

            break;

        case 'true':
        case 'false':
        case 'null':
        case 'undefined':
            js = ast._id;

            break;
    }

    return js;
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

