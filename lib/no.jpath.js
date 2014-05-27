var no = no || require('./no.base.js');

if ( no.de ) {
    require('./no.parser.js');
    require('./no.scheme.js');

    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

(function() {

//  ---------------------------------------------------------------------------------------------------------------  //

no.jpath = function( expr, data, root ) {
    return no.jpath.compile( expr )( data, root );
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Grammar

//  ---------------------------------------------------------------------------------------------------------------  //

//  Priorities of binary operators.
//
var BINOPS = {
    '*': 6,
    '/': 6,
    '%': 6,
    '+': 5,
    '-': 5,
    '<=': 4,
    '>=': 4,
    '<': 4,
    '>': 4,
    '~~': 3,
    '!~': 3,
    '==': 3,
    '!=': 3,
    '&&': 2,
    '||': 1
};


//  ---------------------------------------------------------------------------------------------------------------  //

var tokens = {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Было:
//      tokens.SELF = /^\.(?![a-zA-Z_*[])/;
//
function t_self( parser ) {
    var s = parser.s;

    var c0 = s.charCodeAt( 0 );
    if ( c0 !== 46 ) {
        //  .
        return null;
    }

    var c1 = s.charCodeAt( 1 );
    if ( c1 > 96 && c1 < 123 || c1 > 64 && c1 < 91 || c1 === 95 || c1 === 42 || c1 === 91 ) {
        //  a-zA-Z_*[
        return null;
    }

    return '.';
}


//  Было:
//      tokens.ROOT = /^\/(?![.[])/;
//
function t_root( parser ) {
    var s = parser.s;

    var c0 = s.charCodeAt( 0 );
    if ( c0 !== 47 ) {
        //  /
        return null;
    }

    var c1 = s.charCodeAt( 1 );
    if ( c1 === 46 || c1 === 91 ) {
        //  .[
        return null;
    }

    return '/';
}


//  Было:
//      tokens.BINOP = /^(?:\+|-|\*|\/|%|~~|!~|==|!=|<=|>=|<|>|&&|\|\|)/;
//
//  http://jsperf.com/parse-binop-regexp-vs-charcodeat
//
function t_binop( parser ) {
    var s = parser.s;

    var c0 = s.charCodeAt( 0 );

    if ( c0 === 43 ) { return '+'; }
    if ( c0 === 45 ) { return '-'; }
    if ( c0 === 42 ) { return '*'; }
    if ( c0 === 47 ) { return '/'; }
    if ( c0 === 37 ) { return '%'; }

    var c1 = s.charCodeAt( 1 );

    if ( c0 === 61 ) { return ( c1 === 61 ) ? '==' : null; }
    if ( c0 === 33 ) {
        if ( c1 === 61 ) { return '!='; }
        if ( c1 === 126 ) { return '!~'; }
        return null;
    }
    if ( c0 === 38 ) { return ( c1 === 38 ) ? '&&' : null; }
    if ( c0 === 124 ) { return ( c1 === 124 ) ? '||' : null; }
    if ( c0 === 60 ) { return ( c1 === 61 ) ? '<=' : '<'; }
    if ( c0 === 62 ) { return ( c1 === 61 ) ? '>=' : '>'; }
    if ( c0 === 126 ) { return ( c1 === 126 ) ? '~~' : null; }

    return null;
}


function t_number( parser ) {
    var s = parser.s;

    //  Начинаем с 1, потому что первый символ точно цифра.
    var i = 1;
    var l = s.length;
    var c;


    //  Целая часть.
    while ( i < l && (( c = s.charCodeAt( i ) )) && c > 47 && c < 58 ) {
        i++;
    }

    if ( i < l ) {
        //  Дробная часть.
        if ( s.charCodeAt( i ) === 46 ) {
            //  .
            i++;

            while ( i < l && (( c = s.charCodeAt( i ) )) && c > 47 && c < 58 ) {
                i++;
            }
        }
    }

    //  TODO: Порядок. Например, 1e+2.

    return s.substr( 0, i );
}


//  Было:
//      tokens.ID = /^[a-zA-Z_][a-zA-Z0-9-_]*/;
//
//  http://jsperf.com/parse-id-regexp-vs-charcodeat
//
tokens.ID = function( parser ) {
    var s = parser.s;

    var c = s.charCodeAt( 0 );

    if ( !( c > 96 && c < 123 || c > 64 && c < 91 || c === 95 ) ) {
        //  a-zA-Z_
        return null;
    }

    var i = 1;
    var l = s.length;
    while ( i < l ) {
        c = s.charCodeAt( i );

        if ( !( c > 96 && c < 123 || c > 64 && c < 91 || c > 47 && c < 58 || c === 95 || c === 45 ) ) {
            //  a-zA-Z0-9_-
            break;
        }

        i++;
    }

    return s.substr( 0, i );
};


//  Было:
//      tokens.CHARS = /^[^"{}\\]+/;
//
function t_chars( parser ) {
    var s = parser.s;

    var i = 0;
    var l = s.length;
    while ( i < l ) {
        var c = s.charCodeAt( i );
        if ( c === 34 || c === 123 || c === '125' || c === 92 ) {
            //  "{}\
            break;
        }
        i++;
    }

    return ( i ) ? s.substr( 0, i ) : '';
}


[
    ')',
    ']',
    '}',
    '"'
].forEach( function( s ) {
    tokens[ s ] = s;
} );


//  ---------------------------------------------------------------------------------------------------------------  //

//  expr := unary ( BIN_OP unary )*
//
function r_expr( parser ) {
    //  Here we have list of expressions (arguments) and operators.
    //  We need to group them according to operator's priorities.

    //  There are two stacks. One for operators:
    var ops = [];
    //  And one for arguments. There should be at least one argument so we parse it now:
    var args = [ r_unary( parser ) ];
    parser.skip();

    var op;
    //  Priority of operator on top of `ops`.
    //  In the beginning it's 0.
    var cp = 0;

    //  In the loop we do two operations:
    //
    //    * Shift: read one operator and one argument and put them in `ops` and `args`.
    //    * Reduce: pop all operators with priority greater or equal than given.
    //      For each operator pop two arguments, group them and push back to `args`.
    //
    //  For example: [ 'a', '*', 'b', '+', 'c' ].
    //
    //      args: [ 'a' ]               ops: []
    //      shift
    //      args: [ 'b', 'a' ]          ops: [ '*' ]
    //      reduce( 5 )
    //      args: [ '(a * b)' ]         ops: []
    //      shift
    //      args: [ 'c', '(a * b)' ]    ops: [ '+' ]
    //      reduce( 0 )
    //      args: [ '((a * b) + c)' ]   ops: []
    //
    while (( op = t_binop( parser ) )) {
        parser.move( op.length );
        parser.skip();

        var p = BINOPS[ op ];
        //  Next op has less or equal priority than top of `ops`.
        if ( p <= cp ) {
            //  Reduce.
            reduce( p );
        }
        //  Shift.
        ops.unshift( op );
        args.unshift( r_unary( parser ) );
        parser.skip();

        //  Update cp.
        cp = p;
    }
    //  Reduce all remaining operators.
    reduce( 0 );

    //  Result is on top of the `args`.
    return args[ 0 ];

    function reduce( p ) {
        var op, left, right;
        //  If top of `ops` has greater or equal priority than `p` -- reduce it.
        while ( (( op = ops[ 0 ] )) && ( BINOPS[ op ] >= p ) ) {
            //  Pop two arguments.
            right = args.shift();
            left = args.shift();
            //  Push back result of `op`.
            args.unshift( {
                _id: 'binop',
                //  If either of left or right is local, then binary expression is local too.
                _local: left._local || right._local,

                //  Do not forget to pop `op` out of `ops`.
                op: ops.shift(),
                left: left,
                right: right
            } );
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  unary := UNOP unary | primary

function r_unary( parser ) {
    var op = parser.next_char();
    if ( op === '+' || op === '-' || op === '!' ) {
        parser.move( 1 );

        //  FIXME: Убрать рекурсию.
        var expr = r_unary( parser );

        return {
            _id: 'unop',
            _local: expr._local,

            op: op,
            expr: expr
        };
    }

    return r_primary( parser );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  primary := ( string | jpath | subexpr | number | var | func ) steps?

function r_primary( parser ) {
    var c = parser.next_code();

    if ( c === 34 ) {
        //  "
        return r_string( parser );

    } else if ( c === 46 || c === 47 ) {
        //  ./
        //  FIXME: Передать флаг abs сразу?
        return r_jpath( parser );

    } else if ( c === 40 ) {
        //  (
        return r_subexpr( parser );

    } else if ( c > 47 && c < 58 ) {
        //  0-9
        //
        //  К сожалению, нельзя сделать просто `parserFloat( parser.s )`,
        //  т.к. мы не знаем, сколько символов нужно потом пропустить.
        //
        var number = t_number( parser );
        parser.move( number.length );

        return {
            _id: 'number',

            //  FIXME: Не дешевле ли будет самим считать результат, а не парсить его повторно?
            value: parseFloat( number )
        };
    }

    var name = parser.token( 'ID' );

    var expr;
    if ( parser.next_code() === 40 ) {
        //  (
        expr = {
            _id: 'func',

            name: name,
            args: r_args( parser )
        };

    } else {
        expr = {
            _id: 'var',

            name: name
        };
    }

    c = parser.next_code();
    if ( c === 46 || ch === 91 ) {
        //  .
        //  [
        return {
            _id: 'filter',

            expr: expr,
            jpath: r_jpath_steps( parser )
        };
    }

    return expr;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  args := '(' ( expr ( ',' expr )* )? ')'

function r_args( parser ) {
    parser.move( 1 );
    parser.skip();

    var args = [];
    if ( parser.next_code() !== 41 ) {
        //  )
        args.push( r_expr( parser ) );
        parser.skip();

        while ( parser.next_code() === 44 ) {
            //  ,
            parser.move( 1 );
            parser.skip();
            args.push( r_expr( parser ) );
            parser.skip();
        }
    }

    parser.token( ')' );

    return args;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  subexpr := '(' expr ')'

function r_subexpr( parser ) {
    parser.move( 1 );
    parser.skip();
    var expr = r_expr( parser );
    parser.skip();
    parser.token( ')' );

    return {
        _id: 'subexpr',
        _local: expr._local,

        expr: expr
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  jpath := '.' | '/' | '~' | ( '/' | '~' )? steps
//
function r_jpath( parser ) {

    if ( t_self( parser ) ) {
        parser.move( 1 );

        return {
            _id: 'self',
            _local: true
        };
    }

    if ( t_root( parser ) ) {
        parser.move( 1 );

        return {
            _id: 'root',
        };
    }

    var abs;
    if ( parser.next_code() === 47 ) {
        //  /
        parser.move( 1 );
        abs = true;
    }

    return {
        _id: 'jpath',
        _local: !abs,

        abs: abs,
        steps: r_jpath_steps( parser )
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  steps := step+

function r_jpath_steps( parser ) {
    var steps = [];

    while ( true ) {
        var ch = parser.next_code();

        if ( ch === 46 ) {
            //  .
            var step = r_jpath_step( parser );

            steps.push( step );
        } else if ( ch === 91 ) {
            //  [
            var pred = r_jpath_pred( parser );

            steps.push( pred );
            /*
                FIXME
                if ( pred._id === 'guard' ) {
                    steps.unshift( pred );
                } else {
                    steps.push( pred );
                }
            */
        } else {
            break;
        }
    }

    return steps;
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  jpath_step := '.' jpath_pred | '.*' | '.' ID args?

function r_jpath_step( parser ) {
    parser.move( 1 );

    var ch = parser.next_code();

    if ( ch === 42 ) {
        //  *
        parser.move( 1 );

        return {
            _id: 'starstep'
        };
    }

    var id = parser.token( 'ID' );
    if ( parser.next_code() === 40 ) {
        //  (
        //  TODO: method().
    } else {
        return {
            _id: 'namestep',

            name: id
        };
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  pred := '[' expr ']'

function r_jpath_pred( parser ) {
    parser.move( 1 );
    parser.skip();
    var expr = r_expr( parser );
    parser.skip();
    parser.token( ']' );

    //  There are three types of "predicates":
    //
    //    * Predicate. `expr` is local (i.e. it depends on current context).
    //      Basically it means that it contains at least one non-absolute jpath.
    //
    //    * Global predicate (or guard). `expr` is not local but it has boolean type.
    //
    //    * Index. Global non-boolean expression.
    //
    return {
        _id: 'pred',

        expr: expr
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

function r_string( parser ) {
    parser.token( '"' );
    var content = r_string_content( parser );
    parser.token( '"' );

    return content;
};

var disymbols = {
    '{{': '{',
    '}}': '}',
    '\\"': '"',
    '\\\\': '\\'
    //  FIXME: Нужны ли тут \', \n, \t и т.д.?
};

function r_string_content( parser ) {
    var parts = [];
    var c;
    var str = '';

    while ( parser.s ) {
        c = disymbols[ parser.next( 2 ) ];
        if ( c ) {
            str += c;
            parser.move( 2 );

        } else {
            c = parser.next_code();

            if ( c === 34 ) {
                //  "
                break;
            }

            if ( c === 92 ) {
                //  \
                str += '\\';
                parser.move( 1 );

            } else if ( c === 123 ) {
                //  {
                if ( str ) {
                    parts.push( string_literal( str ) );
                    str = '';
                }

                parser.move( 1 );
                parser.skip();
                parts.push( r_expr( parser ) );
                parser.skip();
                parser.token( '}' );

            } else {
                var chars = t_chars( parser );

                str += chars;
                parser.move( chars.length );
            }
        }
    }
    if ( str ) {
        parts.push( string_literal( str ) );
        str = '';
    }

    //  Это пустая строка.
    if ( !parts.length ) {
        parts.push( string_literal( '' ) );
    }

    return {
        _id: 'string',

        value: parts
    };
};

function string_literal( str ) {
    return {
        _id: 'string_literal',

        value: str
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

var rules = {
    jpath: r_jpath,
    expr: r_expr
};

var grammar = {
    rules: rules,
    tokens: tokens
};

//  ---------------------------------------------------------------------------------------------------------------  //

var parser = new no.Parser( grammar );

//  ---------------------------------------------------------------------------------------------------------------  //

var runtime = {};

function array_step( data, name, result ) {
    for( var i = 0, l = data.length; i < l; i++ ) {
        var item = data[ i ];
        if ( Array.isArray( item ) ) {
            array_step( item, name, result );
        } else {
            var value = item[ name ];
            if ( value !== undefined ) {
                result.push( value );
            }
        }
    }

    return result;
}

function star_step( data, result ) {
    for ( var name in data ) {
        var item = data[ name ];
        //  FIXME: А не нужно ли тут отдельно проверять, не массив ли item?

        result.push( item ); 
    }

    return result;
}

function array_star_step( data, result ) {
    for( var i = 0, l = data.length; i < l; i++ ) {
        var item = data[ i ];
        //  FIXME: Нужно проверять, не массив ли item.

        star_step( item, result );
    }

    return result;
}

function filter( data, root, predicate, result ) {
    for ( var i = 0, l = data.length; i < l; i++ ) {
        var item = data[ i ];

        if ( predicate( item, root ) ) {
            result.push( item );
        }
    }

    return result;
}

runtime.as = array_step;
runtime.ss = star_step;
runtime.ass = array_star_step;
runtime.f = filter;

//  ---------------------------------------------------------------------------------------------------------------  //

var _cache = {};

no.jpath.compile = function( expr, scheme ) {
    var compiled = _cache[ expr ];

    if ( !compiled ) {
        var ast = parser.parse( expr, 'expr' );

        if ( !scheme ) {
            scheme = no.Scheme.default;
        }

        var exprs = [];
        var exid = ( ast._id === 'jpath' ) ? jpath2func( ast, scheme, scheme, exprs ) : expr2func( ast, scheme, scheme, exprs );

        var js = 'var as=R.as,ss=R.ss,ass=R.ass,f=R.f;\n';
        for ( var i = 0; i <= exid; i++ ) {
            js += 'function e' + i + '(d,r){' + exprs[ i ] + '}\n';
        }
        js += 'return e' + exid;

        console.log( js );
        compiled = Function( 'R', js )( runtime );

        _cache[ expr ] = compiled;
    }

    return compiled;
};

//  ---------------------------------------------------------------------------------------------------------------  //

function expr2func( ast, d_scheme, r_scheme, exprs ) {
    var js = 'return(' + ast2js( ast, d_scheme, r_scheme, exprs ) + ');';

    return exprs.push( js ) - 1;
}

function jpath2func( ast, d_scheme, r_scheme, exprs ) {
    var js = '';

    if ( ast.abs ) {
        d_scheme = r_scheme;
    }

    js += d_scheme.gen_prologue();

    var steps = ast.steps;
    for ( var i = 0, l = steps.length; i < l; i++ ) {
        var step = steps[ i ];

        var id = step._id;
        switch ( id ) {
            case 'namestep':
                var name = step.name;
                js += d_scheme.gen_namestep( name );
                d_scheme = d_scheme.namestep( name );
                break;

            case 'starstep':
                js += d_scheme.gen_starstep();
                d_scheme = d_scheme.starstep();
                break;

            case 'pred':
                var exid = expr2func( step.expr, d_scheme, r_scheme, exprs );
                js += d_scheme.gen_pred( exid );
                break;

            case 'index':
                var exid = expr2func( step.expr, d_scheme, r_scheme, exprs );
                js += d_scheme.gen_index( exid );
                d_scheme = d_scheme.index();
                break;

            case 'guard':
                var exid = expr2func( step.expr, d_scheme, r_scheme, exprs );
                js += d_scheme.gen_guard( exid );
                break;
        }
    }

    js += d_scheme.gen_epilogue();

    return exprs.push( js ) - 1;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function ast2js( ast, d_scheme, r_scheme, exprs ) {
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
            for ( var i = 0, l = content.length; i < l;  i++ ) {
                js += '+' + ast2js( content[ i ], d_scheme, r_scheme, exprs );
            }
            js += ')';
            break;

        case 'unop':
            js = ast.op + '(' + ast2js( ast.expr, d_scheme, r_scheme, exprs ) + ')';
            break;

        case 'binop':
            js = ast2js( ast.left, d_scheme, r_scheme, exprs) + ast.op + ast2js( ast.right, d_scheme, r_scheme, exprs );
            break;

        case 'subexpr':
            js = '(' + ast2js( ast.expr, d_scheme, r_scheme, exprs ) + ')';
            break;

        case 'jpath':
            var exid = jpath2func( ast, d_scheme, r_scheme, exprs );
            js = 'e' + exid + ( ( ast.abs ) ? '(r,r)' : '(e,r)' );
            break;

        case 'filter':
            var exid = jpath2func( ast.jpath, d_scheme, r_scheme, exprs );
            js = 'e' + exid + '(' + ast2js( ast.expr, d_scheme, r_scheme, exprs ) + ',r)';
            break;
    }

    return js;
}

//  ---------------------------------------------------------------------------------------------------------------  //

})();

