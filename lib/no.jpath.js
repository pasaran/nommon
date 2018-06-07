var no = require( './no.base.js' );

require( './no.parser.js' );
require( './no.type.js' );

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

        var js = 'var as=R.as,ss=R.ss,ass=R.ass,f=R.f,c=R.c,ts=R.ts,tn=R.tn,tc=R.tc,e=R.e,M=R.M,j=R.j;\n';
        for ( var i = 0; i <= exid; i++ ) {
            js += 'function e' + i + '(d,r,v){' + exprs[ i ] + '}\n';
        }
        js += 'return e' + exid;

        //  console.log( js );
        compiled = Function( 'R', js )( runtime );
    }

    return compiled;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function expr2func( ast, exprs ) {
    var js = 'return(' + ast2js( ast, exprs ) + ');';

    return exprs.push( js ) - 1;
}

function jpath2func( ast, exprs ) {
    var js = ( ast.abs ) ? 'd=r;' : '';
    js += 'if(d==null)return;var a=Array.isArray(d);';

    var steps = ast.steps;
    for ( var i = 0, l = steps.length - 1; i <= l; i++ ) {
        var step = steps[ i ];
        var is_last = ( i === l );

        switch ( step._id ) {
            case 'namestep':
                var name = step.name;
                js += ( is_last ) ?
                    'return a?as(d,"' + name + '",[]):d["' + name + '"]' :
                    'if(a){d=as(d,"' + name + '",[])}else{d=d["' + name + '"];if(d==null)return;a=Array.isArray(d)}';

                break;

            case 'starstep':
                js += ( is_last ) ?
                    'return (a?ass:ss)(d,[])' :
                    'd=(a?ass:ss)(d,[]);a=1;';

                break;

            case 'pred':
                var exid = expr2func( step.expr, exprs );
                js += ( is_last ) ?
                    'if(a)return f(d,r,v,e' + exid + ',[]);if(e' + exid + '(d,r,v))return d' :
                    'if(a){d=f(d,r,v,e' + exid + ',[])}else{if(!e' + exid + '(d,r,v))return}';

                break;

            case 'index':
                var exid = expr2func( step.expr, exprs );
                js += ( is_last ) ?
                    'if(a)return d[e' + exid + '(d,r,v)]' :
                    'if(!a)return;d=d[e' + exid + '(d,r,v)];if(d==null)return;a=Array.isArray(d);';

                break;
        }
    }

    return exprs.push( js ) - 1;
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
                js += '+ts(' + item_js + ')';
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
                js = 'c(' + left_js + ',' + right_js + ')';

            } else if ( op === '!~' ) {
                js = '!c(' + left_js + ',' + right_js + ')';

            } else if ( op === '+' || op === '-' || op === '*' || op === '/' || op === '%' ) {
                left_js = 'tn(' + left_js + ')';
                right_js = 'tn(' + right_js + ')';

            } else if ( op === '<' || op === '<=' || op === '>' || op === '>=' ) {
                left_js = 'tc(' + left_js + ')';
                right_js = 'tc(' + right_js + ')';
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

