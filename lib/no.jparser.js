var no = require( './no.parser' );

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
    '===': 3,
    '!==': 3,
    '&&': 2,
    '||': 1
};


//  ---------------------------------------------------------------------------------------------------------------  //

var tokens = {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Было:
//      tokens.SELF = /^\.(?![a-zA-Z0-9_*])/;
//
function t_self( parser ) {
    var s = parser.s;
    var l = parser.l;
    var x = parser.x;

    if ( x >= l ) {
        return null;
    }

    var c0 = s.charCodeAt( x );
    if ( c0 !== 46 ) {
        //  .
        return null;
    }

    var i = x + 1;
    if ( i < l ) {
        var c1 = s.charCodeAt( i );
        if (
            //  a-z
            c1 > 96 && c1 < 123 ||
            //  A-Z
            c1 > 64 && c1 < 91 ||
            //  0-9
            c1 > 47 && c1 < 58 ||
            //  _*
            c1 === 95 || c1 === 42
        ) {
            return null;
        }
    }

    return '.';
}


//  Было:
//      tokens.ROOT = /^\/(?![.[{])/;
//
function t_root( parser ) {
    var s = parser.s;
    var l = parser.l;
    var x = parser.x;

    if ( x >= l ) {
        return null;
    }

    var c0 = s.charCodeAt( x );
    if ( c0 !== 47 ) {
        //  /
        return null;
    }

    var i = x + 1;
    if ( i < l ) {
        var c1 = s.charCodeAt( i );
        if ( c1 === 46 || c1 === 91 || c1 === 123 ) {
            //  .[{
            return null;
        }
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
    var l = parser.l;
    var x = parser.x;

    if ( x >= l ) {
        return null;
    }

    var c0 = s.charCodeAt( x );

    if ( c0 === 43 ) {
        return '+';
    }
    if ( c0 === 45 ) {
        return '-';
    }
    if ( c0 === 42 ) {
        return '*';
    }
    if ( c0 === 47 ) {
        return '/';
    }
    if ( c0 === 37 ) {
        return '%';
    }

    var i = x + 1;
    if ( i >= l ) {
        if ( c0 === 60 ) {
            return '<';
        }
        if ( c0 === 62 ) {
            return '>';
        }
        return null;
    }

    var c1 = s.charCodeAt( i );

    if ( c0 === 61 ) {
        if ( c1 === 61 ) {
            var i = x + 2;
            if ( i < l ) {
                var c2 = s.charCodeAt( i );
                if ( c2 === 61 ) {
                    return '===';
                }
            }
            return '==';

        } else {
            return null;
        }
    }
    if ( c0 === 33 ) {
        if ( c1 === 61 ) {
            var i = x + 2;
            if ( i < l ) {
                var c2 = s.charCodeAt( i );
                if ( c2 === 61 ) {
                    return '!==';
                }
            }
            return '!=';
        }
        if ( c1 === 126 ) {
            return '!~';
        }
        return null;
    }
    if ( c0 === 38 ) {
        return ( c1 === 38 ) ? '&&' : null;
    }
    if ( c0 === 124 ) {
        return ( c1 === 124 ) ? '||' : null;
    }
    if ( c0 === 60 ) {
        return ( c1 === 61 ) ? '<=' : '<';
    }
    if ( c0 === 62 ) {
        return ( c1 === 61 ) ? '>=' : '>';
    }
    if ( c0 === 126 ) {
        return ( c1 === 126 ) ? '~~' : null;
    }

    return null;
}


function t_number( parser ) {
    var s = parser.s;
    var l = parser.l;
    var x = parser.x;

    //  Начинаем с 1, потому что первый символ точно цифра.
    var i = x + 1;
    var c;

    //  Целая часть.
    while ( i < l ) {
        c = s.charCodeAt( i );
        if ( c < 48 || c > 57 ) {
            break;
        }
        i++;
    }

    if ( i < l ) {
        //  Дробная часть.
        if ( s.charCodeAt( i ) === 46 ) {
            //  .
            i++;

            while ( i < l ) {
                c = s.charCodeAt( i );
                if ( c < 48 || c > 57 ) {
                    break;
                }
                i++;
            }
        }
    }

    //  TODO: Порядок. Например, 1e+2.

    return s.substring( x, i );
}


//  Было:
//      tokens.ID = /^[a-zA-Z_][a-zA-Z0-9-_]*/;
//
//  http://jsperf.com/parse-id-regexp-vs-charcodeat
//
tokens.ID = function( parser ) {
    var s = parser.s;
    var l = parser.l;
    var x = parser.x;

    if ( x >= l ) {
        return null;
    }

    var c = s.charCodeAt( x );

    if ( !( c > 96 && c < 123 || c > 64 && c < 91 || c === 95 ) ) {
        //  a-zA-Z_
        return null;
    }

    var i = x + 1;
    while ( i < l ) {
        c = s.charCodeAt( i );
        if ( !( c > 96 && c < 123 || c > 64 && c < 91 || c > 47 && c < 58 || c === 95 || c === 45 ) ) {
            //  a-zA-Z0-9_-
            break;
        }

        i++;
    }

    return s.substring( x, i );
};


//  Было:
//      tokens.STEP = /^[a-zA-Z0-9-_]+/;
//
tokens.STEP = function( parser ) {
    var s = parser.s;
    var l = parser.l;
    var x = parser.x;

    var i = x;
    while ( i < l ) {
        var c = s.charCodeAt( i );
        if ( !( c > 96 && c < 123 || c > 64 && c < 91 || c > 47 && c < 58 || c === 95 || c === 45 ) ) {
            //  a-zA-Z0-9_-
            break;
        }

        i++;
    }

    return ( i > x ) ? s.substring( x, i ) : null;
};


//  Было:
//      tokens.CHARS = /^[^"{}\\]+/;
//
function t_chars( parser ) {
    var s = parser.s;
    var l = parser.l;
    var x = parser.x;

    var i = x;
    while ( i < l ) {
        var c = s.charCodeAt( i );
        if ( c === 34 || c === 123 || c === 125 || c === 92 ) {
            //  "{}\
            break;
        }

        i++;
    }

    //  FIXME: Почему тут '', а не null как везде?
    //
    return ( i > x ) ? s.substring( x, i ) : '';
}


[
    ')',
    ']',
    '}',
    '"',
    ':'
].forEach( function( s ) {
    tokens[ s ] = s;
} );


//  ---------------------------------------------------------------------------------------------------------------  //

//  expr := ternary | binary
//  ternary := binary '?' expr : expr
//
function r_expr( parser ) {
    var expr = r_binary( parser );

    var c = parser.next_code();
    if ( c === 63 ) {
        //  ?
        parser.move( 1 );
        parser.skip();

        var ast = {
            _id: 'ternary',

            condition: expr
        };
        ast.then = r_expr( parser );
        parser.token( ':' );
        parser.skip();
        ast.else = r_expr( parser );

        return ast;
    }

    return expr;
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  binary := unary ( BIN_OP unary )*
//
function r_binary( parser ) {
    //  Here we have list of expressions (arguments) and operators.
    //  We need to group them according to operator's priorities.

    //  There are two stacks. One for operators:
    var ops = [];
    //  And one for arguments. There should be at least one argument so we parse it now:
    var args = [ r_unary( parser ) ];
    parser.skip();

    //  Priority of operator on top of `ops`.
    //  In the beginning it's 0.
    var cp = 0;

    //  In the loop we do two operations:
    //
    //    * Shift: read one operator and one argument and put them in `ops` and `args`.
    //    * Reduce: pop all operators with priority greater or equal than given.
    //      For each operator pop two arguments, group them and push back to `args`.
    //
    //  For example: 'a * b - c - d  > e * f + g * h':
    //
    //      init:
    //          args: [ 'a' ]
    //          ops: []
    //          cp: 0
    //
    //      "*", p = 6, no reduce
    //      shift:
    //          args: [ 'a', 'b' ]
    //          ops: [ '*' ]
    //          cp: 6
    //
    //      "-", p = 5, reduce( 5 ):
    //          args: [ 'a * b' ]
    //          ops: []
    //      shift:
    //          args: [ 'a * b', 'c' ]
    //          ops: [ '-' ]
    //          cp: 5
    //
    //      "-", p = 5, reduce( 5 ):
    //          args: [ 'a * b - c' ]
    //          ops: []
    //      shift:
    //          args: [ 'a * b - c', 'd' ]
    //          ops: [ '-' ]
    //          cp: 5
    //
    //      ">", p = 4, reduce( 4 ):
    //          args: [ 'a * b - c - d' ]
    //          ops: []
    //      shift:
    //          args: [ 'a' * b - c - d', 'e' ]
    //          ops: [ '>' ]
    //          cp: 4
    //
    //      "*", p = 6, no reduce
    //      shift:
    //          args: [ 'a * b - c - d', 'e', 'f' ]
    //          ops: [ '>', '*' ]
    //          cp: 6
    //
    //      "+", p = 5, reduce( 5 ):
    //          args: [ 'a * b - c - d', 'e * f' ]
    //          ops: [ '>' ]
    //      shift:
    //          args: [ 'a * b - c - d', 'e * f', 'g' ]
    //          ops: [ '>', '+' ]
    //          cp: 5
    //
    //      "*", p = 6, no reduce
    //      shift:
    //          args: [ 'a * b - c - d', 'e * f', 'g', 'h' ]
    //          ops: [ '>', '+', '*' ]
    //          cp: 6
    //
    //      reduce( 0 )
    //          args: [ 'a * b - c - d', 'e * f', 'g * h' ]
    //          ops: [ '>', '+' ]
    //
    //          args: [ 'a * b - c - d', 'e * f + g * h' ]
    //          ops: [ '>' ]
    //
    //          args: [ 'a * b - c - d > e * f + g * h' ]
    //          ops: []
    //
    while ( true ) {
        var op = t_binop( parser );
        if ( !op ) {
            break;
        }

        parser.move( op.length );
        parser.skip();

        var p = BINOPS[ op ];
        //  Next op has less or equal priority than top of `ops`.
        if ( p <= cp ) {
            //  Reduce.
            _reduce( p, ops, args );
        }
        //  Shift.
        ops.push( op );
        args.push( r_unary( parser ) );
        parser.skip();

        //  Update cp.
        cp = p;
    }
    //  Reduce all remaining operators.
    _reduce( 0, ops, args );

    //  Result is on top of the `args`.
    return args[ 0 ];
}

function _reduce( p, ops, args ) {
    var last = ops.length - 1;

    //  If top of `ops` has greater or equal priority than `p` -- reduce it.
    while ( true ) {
        var op = ops[ last-- ];
        if ( !op || ( BINOPS[ op ] < p ) ) {
            break;
        }

        //  Pop two arguments.
        var right = args.pop();
        var left = args.pop();

        //  Push back result of `op`.
        args.push( {
            _id: 'binop',

            //  Do not forget to pop `op` out of `ops`.
            op: ops.pop(),
            left: left,
            right: right
        } );
    }
}


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

            op: op,
            expr: expr
        };
    }

    return r_primary( parser );
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  primary := ( string | jpath | subexpr | number | var | func ) steps?

function r_primary( parser ) {
    var c = parser.next_code();

    var expr;

    if ( c === 34 ) {
        //  "
        expr = r_string( parser );

    } else if ( c === 46 || c === 47 ) {
        //  ./
        //  FIXME: Передать флаг abs сразу?
        expr = r_jpath( parser );

    } else if ( c === 40 ) {
        //  (
        expr = r_subexpr( parser );

    } else if ( c > 47 && c < 58 ) {
        //  0-9
        //
        //  К сожалению, нельзя сделать просто `parserFloat( parser.s )`,
        //  т.к. мы не знаем, сколько символов нужно потом пропустить.
        //
        var number = t_number( parser );
        parser.move( number.length );

        expr = {
            _id: 'number',

            //  FIXME: Не дешевле ли будет самим считать результат, а не парсить его повторно?
            value: parseFloat( number )
        };

    /*
    } else if ( c === 38 ) {
        //  &
        expr = r_jref( parser );
    */

    } else {
        var name = parser.token( 'ID' );

        if ( name === 'true' || name === 'false' || name === 'null' || name === 'undefined' ) {
            expr = {
                _id: name
            };

        } else {
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
        }
    }

    c = parser.next_code();
    //  FIXME: Что-то типа ..foo может распарситься.
    //  Точка не может быть после self.
    //
    if ( c === 46 || c === 91 || c === 123 ) {
        //  .[{
        return {
            _id: 'filter',

            expr: expr,
            jpath: r_jpath( parser )
        };
    }

    return expr;
}

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
}

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

        expr: expr
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  jpath := '.' | '/' | ( '/' )? steps
//
function r_jpath( parser ) {

    if ( t_self( parser ) ) {
        parser.move( 1 );

        return {
            _id: 'self',
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

        abs: abs,
        steps: r_jpath_steps( parser )
    };
}

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

        } else if ( ch === 123 ) {
            //  {
            var pred = r_jpath_pred( parser );
            steps.push( pred );

        } else if ( ch === 91 ) {
            //  [
            var index = r_jpath_index( parser );
            steps.push( index );

        } else {
            break;
        }
    }

    return steps;
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  jpath_step := '.*' | '.' ID args?

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

    return {
        _id: 'namestep',

        name: parser.token( 'STEP' )
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  pred := '{' expr '}'

function r_jpath_pred( parser ) {
    parser.move( 1 );
    parser.skip();

    var expr = r_expr( parser );

    parser.skip();
    parser.token( '}' );

    return {
        _id: 'pred',

        expr: expr
    };
}

//  index := '[' expr ']'

function r_jpath_index( parser ) {
    parser.move( 1 );
    parser.skip();

    var expr = r_expr( parser );

    parser.skip();
    parser.token( ']' );

    return {
        _id: 'index',

        expr: expr
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

function r_string( parser ) {
    parser.token( '"' );
    var content = r_string_content( parser, true );
    parser.token( '"' );

    return content;
}

var disymbols = {
    '{{': '{',
    '}}': '}',
    '\\"': '"',
    '\\\\': '\\'
    //  FIXME: Нужны ли тут \', \n, \t и т.д.?
};

function r_string_content( parser, is_quoted_string ) {
    var parts = [];
    var c;
    var str = '';

    while ( !parser.is_eol() ) {
        c = disymbols[ parser.next( 2 ) ];
        if ( c ) {
            str += c;
            parser.move( 2 );

        } else {
            c = parser.next_code();

            //  Если мы парсим полноценную строку "foo", то " — это конец строки,
            //  но если строка пришла из `no.jpath.string( 'Hello "nop"' )`,
            //  то " — это просто символ.
            if ( c === 34 ) {
                //  "
                if ( is_quoted_string ) {
                    break;
                }

                str += '"';
                parser.move( 1 );
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
}

function string_literal( str ) {
    return {
        _id: 'string_literal',

        value: str
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

var rules = {
    jpath: r_jpath,
    expr: r_expr,
    string_content: r_string_content
};

var grammar = {
    rules: rules,
    tokens: tokens
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = new no.Parser( grammar );

