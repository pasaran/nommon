var no = require( './no.base.js' );

require( './no.parser.js' );
require( './no.type.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _jpaths = {};
var _jpaths_schemes = {};

var _external_schemes = {};
var _external_bodies = {};

var scheme_default = no.Type.default;
var scheme_string = no.Type.string;
var scheme_number = no.Type.number;
var scheme_boolean = no.Type.boolean;

//  ---------------------------------------------------------------------------------------------------------------  //

no.jpath = function( jpath, data, vars ) {
    return no.jpath.expr( jpath )( data, data, vars );
};

no.jpath.add = function( jid, jpath, scheme ) {
    if ( _jpaths[ jid ] ) {
        no.throw( 'Jpath "%jid" already added', { jid: jid } );
    }

    if ( !scheme ) {
        scheme = scheme_default;
    }

    if ( typeof jpath !== 'function' ) {
        jpath = no.jpath.expr( jpath, scheme );
    }

    _jpaths[ jid ] = jpath;
    _jpaths_schemes[ jid ] = scheme;

    return jpath;
};

no.jpath.get = function( jid ) {
    var jpath = _jpaths[ jid ];
    if ( !jpath ) {
        no.throw( 'Jpath "%jid" not found', { jid: jid } );
    }

    return jpath;
};

no.jpath.expr = function( expr, scheme ) {
    var type = typeof expr;

    if ( type === 'string' ) {
        return compile( expr, 'expr', scheme );

    } else if ( type === 'function' ) {
        return expr;

    } else if ( expr && type === 'object' ) {
        return ( Array.isArray( expr ) ) ? compile_array( expr, scheme ) : compile_object( expr, scheme );

    } else {
        return function() {
            return expr;
        };
    }
};

no.jpath.string = function( expr, scheme ) {
    return compile( expr, 'string_content', scheme );
};

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_object( object, scheme ) {
    var items = {};

    for ( var key in object ) {
        items[ key ] = no.jpath.expr( object[ key ], scheme );
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

function compile_array( array, scheme ) {
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

function compile( expr, id, scheme ) {
    var key = expr + '::' + id;

    if ( !scheme ) {
        scheme = scheme_default;
    }

    var compiled = scheme._compiled_jpaths[ key ];
    if ( !compiled ) {
        var ast = parser.parse( expr, id );

        //  no.inspect( ast );

        var exprs = [];
        var exid = ( ast._id === 'jpath' ) ? jpath2func( ast, scheme, scheme, exprs ) : expr2func( ast, scheme, scheme, exprs );

        var js = 'var as=R.as,ss=R.ss,ass=R.ass,f=R.f,c=R.c,ts=R.ts,tn=R.tn,tc=R.tc,e=R.e,M=R.M,j=R.j;\n';
        for ( var i = 0; i <= exid; i++ ) {
            js += 'function e' + i + '(d,r,v){' + exprs[ i ] + '}\n';
        }
        js += 'return e' + exid;

        //  console.log( js );
        compiled = Function( 'R', js )( runtime );

        scheme._compiled_jpaths[ key ] = compiled;
    }

    return compiled;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function expr2func( ast, d_scheme, r_scheme, exprs ) {
    var js = 'return(' + ast2js( ast, d_scheme, r_scheme, exprs ) + ');';

    return exprs.push( js ) - 1;
}

function jpath2func( ast, d_scheme, r_scheme, exprs ) {
    var js = '';

    if ( ast.abs ) {
        d_scheme = r_scheme;

        js = 'd=r;';
    }

    js += d_scheme.js_prologue();

    var steps = ast.steps;
    for ( var i = 0, l = steps.length - 1; i <= l; i++ ) {
        var step = steps[ i ];

        var is_last = ( i === l );

        var id = step._id;
        switch ( id ) {
            case 'namestep':
                var name = step.name;
                js += d_scheme.js_namestep( name, is_last );
                d_scheme = d_scheme.type_namestep( name );

                break;

            case 'starstep':
                js += d_scheme.js_starstep( is_last );
                d_scheme = d_scheme.type_starstep();

                break;

            case 'pred':
                var expr = step.expr;
                //  FIXME: А нормально, что тут type_pred, хотя там может быть и type_index?
                var exid = expr2func( expr, d_scheme.type_pred(), r_scheme, exprs );

                js += d_scheme.js_pred( exid, is_last );
                //  FIXME: А тут не должно быть что-то типа:
                //  d_scheme = d_scheme.type_pred();

                break;

            case 'index':
                var expr = step.expr;
                //  FIXME: А нормально, что тут type_pred, хотя там может быть и type_index?
                var exid = expr2func( expr, d_scheme.type_pred(), r_scheme, exprs );

                //  Это индекс.
                js += d_scheme.js_index( exid, is_last );
                d_scheme = d_scheme.type_index();

                break;

            /*
            case 'method':
                var args = step.args;
                var js_args = '';
                for ( var j = 0, m = args.length; j < m; j++ ) {
                    if ( j ) {
                        js_args += ',';
                    }
                    js_args += ast2js( args[ j ], d_scheme, r_scheme, exprs );
                }

                var name = step.name;

                js += d_scheme.js_method( name, js_args, is_last );
                d_scheme = d_scheme.type_method( name );

                break;
            */
        }
    }

    js += d_scheme.js_epilogue();

    ast._scheme = d_scheme;

    return exprs.push( js ) - 1;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function ast2js( ast, d_scheme, r_scheme, exprs ) {
    var js;

    switch ( ast._id ) {

        case 'root':
            js = 'r';

            ast._scheme = r_scheme;

            break;

        case 'self':
            js = 'd';

            ast._scheme = d_scheme;

            break;

        case 'number':
            js = ast.value;

            ast._scheme = scheme_number;

            break;

        case 'string_literal':
            js = JSON.stringify( ast.value );

            ast._scheme = scheme_string;

            break;

        case 'string':
            js = '(""';
            var content = ast.value;
            for ( var i = 0, l = content.length; i < l; i++ ) {
                var item = content[ i ];
                var item_js = ast2js( item, d_scheme, r_scheme, exprs );
                js += '+' + item._scheme.js_to_string( item_js );
            }
            js += ')';

            ast._scheme = scheme_string;

            break;

        case 'ternary':
            js = '((' + ast2js( ast.condition, d_scheme, r_scheme, exprs ) + ')?' +
                ast2js( ast.then, d_scheme, r_scheme, exprs ) + ':' +
                ast2js( ast.else, d_scheme, r_scheme, exprs ) + ')';

            ast._scheme = ( ast.then._scheme === ast.else._scheme ) ? ast.then._scheme : scheme_default;

            break;

        case 'unop':
            var op = ast.op;
            js = op + '(' + ast2js( ast.expr, d_scheme, r_scheme, exprs ) + ')';

            ast._scheme = ( op === '-' ) ? scheme_number : scheme_boolean;

            break;

        case 'binop':
            var op = ast.op;
            var left = ast.left;
            var right = ast.right;

            var left_js = ast2js( left, d_scheme, r_scheme, exprs );
            var right_js = ast2js( right, d_scheme, r_scheme, exprs );

            if ( op === '~~' ) {
                js = 'c(' + left_js + ',' + right_js + ')';
                //  FIXME: Какая тут схема получается на выходе? boolean?

            } else if ( op === '!~' ) {
                js = '!c(' + left_js + ',' + right_js + ')';
                //  FIXME: То же самое.

            } else if ( op === '+' || op === '-' || op === '*' || op === '/' || op === '%' ) {
                left_js = left._scheme.js_to_number( left_js );
                right_js = right._scheme.js_to_number( right_js );

                ast._scheme = scheme_number;

            } else if ( op === '<' || op === '<=' || op === '>' || op === '>=' ) {
                left_js = left._scheme.js_to_comparable( left_js );
                right_js = right._scheme.js_to_comparable( right_js );

                ast._scheme = scheme_boolean;

            } else if ( op === '&&' || op === '||' ) {
                var left_scheme = left._scheme;
                var right_scheme = right._scheme;

                ast._scheme = ( left_scheme === right_scheme ) ? left_scheme : scheme_default;

            } else {
                //  А что тут осталось?
                //  ==, !=
                //

                ast._scheme = scheme_boolean;
            }

            if ( !js ) {
                js = left_js + op + right_js;
            }

            break;

        case 'subexpr':
            var expr = ast.expr;
            js = '(' + ast2js( expr, d_scheme, r_scheme, exprs ) + ')';

            ast._scheme = expr._scheme;

            break;

        case 'jpath':
            var exid = jpath2func( ast, d_scheme, r_scheme, exprs );
            js = 'e' + exid + '(d,r,v)';

            //  NOTE: ast._scheme выставит jpath2func.

            break;

        case 'jref':
            var jid = ast.jid;
            if ( !_jpaths[ jid ] ) {
                no.throw( 'Jpath "%jid" not found', { jid: jid } );
            }

            js = 'j[' + JSON.stringify( jid ) + '](d,r,v)';

            ast._scheme = _jpaths_schemes[ jid ];

            break;

        case 'var':
            js = 'v["' + ast.name + '"]';

            ast._scheme = scheme_default;

            break;

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

        case 'filter':
            var exid = jpath2func( ast.jpath, d_scheme, r_scheme, exprs );
            js = 'e' + exid + '(' + ast2js( ast.expr, d_scheme, r_scheme, exprs ) + ',r,v)';
            //  FIXME: Тут нужно правильно вычислять схему.
            //  Вроде бы она должна проставляться в jpath2func, но нет.
            ast._scheme = scheme_default;
            break;

        case 'true':
        case 'false':
            js = ast._id;
            ast._scheme = scheme_boolean;
            break;

        case 'null':
        case 'undefined':
            js = ast._id;
            ast._scheme = scheme_default;
            break;
    }

    return js;
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  Example:
//
//      no.jpath.defunc( 'urlencode', function( s ) {
//          return encodeURIComponent( s || '' );
//      } );
//
//      no.jpath.defunc( 'substr', {
//          scheme: 'string',
//          body: function( s, from, to ) {
//              return ( s || '' ).substr( from, to );
//          }
//      } );
//
no.jpath.defunc = function( name, def ) {
    var scheme;
    var body;

    if ( typeof def === 'function' ) {
        scheme = scheme_default;
        body = def;

    } else {
        scheme = no.Type.get( def.scheme ) || scheme_default;
        body = def.body;
    }

    _external_schemes[ name ] = scheme;
    _external_bodies[ name ] = body;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

