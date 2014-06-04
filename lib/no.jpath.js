var no = no || require('./no.base.js');

if ( no.de ) {
    require('./no.parser.js');

    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

(function() {

//  ---------------------------------------------------------------------------------------------------------------  //

var _jpaths = {};
var _jpaths_schemes = {};

var _scid = 0;
var _schemes = {};

var _method_schemes = {};
var _method_bodies = {};

var _external_schemes = {};
var _external_bodies = {};

var scheme_default;
var scheme_scalar;
var scheme_string;
var scheme_number;
var scheme_boolean;

//  ---------------------------------------------------------------------------------------------------------------  //

no.jpath = function( jpath, data, vars ) {
    return no.jpath.expr( jpath )( data, data, vars );
};

no.jpath.add = function( jid, jpath, scheme ) {
    if ( _jpaths[ jid ] ) {
        no.error( 'Jpath "%s" already added', jid );
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
        no.error( 'Jpath "%s" not found', jid );
    }

    return jpath;
};

no.jpath.expr = function( expr, scheme ) {
    return compile( expr, 'expr', scheme );
};

no.jpath.string = function( expr, scheme ) {
    return compile( expr, 'string_content', scheme );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme = function( scid, scheme ) {
    this._init( scid, scheme );
};

no.Scheme.prototype._init = function( scid, scheme ) {
    if ( typeof scid !== 'string' ) {
        scheme = scid;

        scid = 'scheme_' + _scid++;
    }

    if ( _schemes[ scid ] ) {
        no.error( 'Scheme with id "%s" already exists', scid );
    }

    this.scid = scid;

    this._cache = {};
    _method_schemes[ scid ] = {};
    _method_bodies[ scid ] = {};

    var methods = this.methods || {};
    for ( var name in methods ) {
        var method = methods[ name ];
        this.add_method( name, method.scheme, method.body );
    }

    this.init( scheme );

    //  FIXME: Не хранить схемы с автосгенеренными id.
    _schemes[ scid ] = this;
};

no.Scheme.prototype.init = no.op;

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.add_method = function( scid, name, scheme, body ) {
    if ( _method_schemes[ scid ][ name ] ) {
        no.error( 'Method %s() already defined in scheme %s', name, this.scid );
    }

    _method_schemes[ scid ][ name ] = scheme;
    _method_bodies[ scid ][ name ] = body;
};

no.Scheme.prototype.add_method = function( name, scheme, body ) {
    no.Scheme.add_method( this.scid, name, scheme, body );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.get = function( scid ) {
    var scheme = _schemes[ scid ];

    if ( !scheme ) {
        no.error( 'No scheme "%s"', scid );
    }

    return scheme;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.extend = function( props ) {
    var ctor = function( scid, scheme ) {
        this._init( scid, scheme );
    };

    no.inherit( ctor, this, props );

    ctor.extend = this.extend;

    return ctor;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.extend( no.Scheme.prototype, {
    is_default: no.false,

    pred: function() {
        return this;
    },

    _get_method: function( name ) {
        var method = _method_schemes[ this.scid ][ name ];
        if ( !method ) {
            no.error( "Scheme %s doesn't have method %s()", this.scid, name );
        }

        return no.Scheme.get( method );
    },

    method: function( name ) {
        var method = this._get_method( name );

        return method;
    },

    gen_prologue: function() {
        return 'var a;';
    },

    gen_epilogue: function() {
        return 'return d;';
    },

    gen_prop: function( name ) {
        return 'd["' + name + '"]';
    },

    gen_array_prop: function( name ) {
        return 'as(d,"' + name + '",[])';
    },

    gen_method: function( name, args ) {
        var js = 'd=M[' + JSON.stringify(this.scid) + ']["' + name + '"](d,' + args + ');';

        var scheme = this._get_method( name );
        if ( scheme.is_default() ) {
            js += 'if(d==null)return;';
            js += 'a=Array.isArray(d);';
        }

        return js;
    },

    gen_to_string: function( js ) {
        return 'ts(' + js + ')';
    },

    gen_to_number: function( js ) {
        return 'tn(' + js + ')';
    },

    gen_to_comparable: function( js ) {
        return 'tc(' + js + ')';
    },

} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Default = no.Scheme.extend( {
    is_default: no.true,

    namestep: function( name ) {
        return this;
    },

    starstep: function() {
        return new no.Scheme.Array( scheme_default );
    },

    index: function() {
        return this;
    },

    gen_prologue: function() {
        return 'if(d==null)return;var a=Array.isArray(d);';
    },

    gen_namestep: function( name ) {
        return 'if(a){d=' + this.gen_array_prop( name ) + '}else{d=' + this.gen_prop( name ) + ';if(d==null)return;a=Array.isArray(d)}';
    },

    gen_starstep: function() {
        return 'd=(a?ass:ss)(d,[]);';
    },

    gen_index: function( exid ) {
        var js = 'if(a){d=d[e' + exid + '(d,r,v)];if(d==null)return;a=Array.isArray(d)}else{return}';

        return js;
    },

    gen_pred: function( exid ) {
        return 'if(a){d=f(d,r,v,e' + exid + ',[])}else{if(!e' + exid + '(d,r,v))return}';
    },

} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Array = no.Scheme.extend( {
    init: function( array ) {
        var scheme = array[ 0 ];
        this.scheme = ( scheme ) ? no.scheme( scheme ) : scheme_default;
    },

    namestep: function( name ) {
        //  FIXME: Сделать дефолтный `new Scheme.Array( new Scheme.Default() )`
        //  и отдавать его, если `scheme.is_default()`.
        //
        var scheme = this.scheme.namestep( name );

        return new no.Scheme.Array( scheme );
    },

    index: function() {
        return this.scheme;
    },

    pred: function() {
        return this.scheme;
    },

    gen_namestep: function( name ) {
        return 'd=' + this.gen_array_prop( name ) + ';';
    },

    gen_starstep: function() {
        return 'd=ass(d,[]);';
    },

    gen_index: function( exid ) {
        return 'd=d[e' + exid + '(d,r,v)];if(d==null)return;';
    },

    gen_pred: function( exid ) {
        return 'd=f(d,r,v,e' + exid + ',[]);';
    },
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Object = no.Scheme.extend( {
    init: function( object ) {
        var compiled = this.scheme = {};

        for ( var name in object ) {
            compiled[ name ] = no.scheme( object[ name ] );
        }
    },

    namestep: function( name ) {
        return this.scheme[ name ] || scheme_default;
    },

    index: function() {
        //  FIXME: Нужно бросать ошибку.
        return scheme_default;
    },

    gen_namestep: function( name ) {
        var js = 'd=' + this.gen_prop( name ) + ';';

        var scheme = this.namestep( name );
        if ( scheme.is_default() ) {
            js += 'if(d==null)return;';
            js += 'a=Array.isArray(d);';
        }

        return js;
    },

    gen_index: function( exid ) {
        //  FIXME: Нужно бросать ошибку, видимо.
        return 'return;';
    },

    gen_pred: function( exid ) {
        return 'if(!e' + exid + '(d,r,v))return;';
    },
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Scalar = no.Scheme.extend( {
    namestep: function( name ) {
        return scheme_default;
    },

    gen_to_comparable: function( js ) {
        return js;
    },
} );

no.Scheme.String = no.Scheme.Scalar.extend( {
    methods: {
        'substr': {
            scheme: 'string',
            body: function( s, from, to ) {
                return s.substr( from, to );
            }
        }
    },

    gen_to_string: function( js ) {
        return js;
    },
} );

no.Scheme.Number = no.Scheme.Scalar.extend( {
    gen_to_number: function( js ) {
        return js;
    },
} );

no.Scheme.Boolean = no.Scheme.Scalar.extend( {

} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.scheme = function( type ) {
    if ( type instanceof no.Scheme ) {
        return type;
    }

    switch ( typeof type ) {
        case 'string':
            return no.Scheme.get( type );

        /*
        case 'function':
            if ( type === no.Model || type.prototype instanceof no.Model ) {
                //  TODO:
                //  return type.scheme;

            } else {
                throw Error( 'Invalid type' );
            }
        */

        case 'object':
            return ( Array.isArray( type ) ) ? new no.Scheme.Array( type ) : new no.Scheme.Object( type );
    }

    //  FIXME: Ошибка!
};

//  ---------------------------------------------------------------------------------------------------------------  //

scheme_default = no.Scheme.default = new no.Scheme.Default( 'default' );

scheme_scalar = no.Scheme.scalar = new no.Scheme.Scalar( 'scalar' );
scheme_string = no.Scheme.string = new no.Scheme.String( 'string' );
scheme_number = no.Scheme.number = new no.Scheme.Number( 'number' );
scheme_boolean = no.Scheme.boolean = new no.Scheme.Boolean( 'boolean' );

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
    if ( c1 > 96 && c1 < 123 || c1 > 64 && c1 < 91 || c1 === 95 || c1 === 42 ) {
        //  NOTE: Не включаем сюда [, чтобы `.[ .foo ]` парсился бы как `.` + `[ .foo ]` (т.е. filter).
        //  a-zA-Z_*
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
        if ( c === 34 || c === 123 || c === 125 || c === 92 ) {
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
            _local: expr._local,

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

    } else if ( c === 38 ) {
        //  &
        expr = r_jref( parser );

    } else {
        var name = parser.token( 'ID' );

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

    c = parser.next_code();
    if ( c === 46 || c === 91 ) {
        //  .
        //  [
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
        _local: expr._local,

        expr: expr
    };
}

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

        } else if ( ch === 91 ) {
            //  [
            var pred = r_jpath_pred( parser );
            steps.push( pred );

        } else {
            break;
        }
    }

    return steps;
}

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
        return {
            _id: 'method',

            name: id,
            args: r_args( parser )
        };
    }

    return {
        _id: 'namestep',

        name: id
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  pred := '[' expr ']'

function r_jpath_pred( parser ) {
    parser.move( 1 );
    parser.skip();
    var expr = r_expr( parser );
    parser.skip();
    parser.token( ']' );

    //  There are two types of "predicates":
    //
    //    * Predicate. `expr` is local (i.e. it depends on current context).
    //      Basically it means that it contains at least one non-absolute jpath.
    //
    //    * Index. Global non-boolean expression.
    //
    return {
        _id: 'pred',

        expr: expr
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

function r_jref( parser ) {
    parser.move( 1 );

    return {
        _id: 'jref',

        jid: parser.token( 'ID' )
    };
}


//  ---------------------------------------------------------------------------------------------------------------  //

function r_string( parser ) {
    parser.token( '"' );
    var content = r_string_content( parser );
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

function filter( data, root, vars, predicate, result ) {
    for ( var i = 0, l = data.length; i < l; i++ ) {
        var item = data[ i ];

        if ( predicate( item, root, vars ) ) {
            result.push( item );
        }
    }

    return result;
}

function to_string( data ) {
    if ( !data || typeof data === 'object' ) {
        return '';
    }

    return '' + data;
}

function to_number( data ) {
    if ( !data || typeof data !== 'number' ) {
        return 0;
    }

    return data;
}

function to_comparable( data ) {
    var type = typeof data;
    if ( type === 'string' || type === 'number' ) {
        return data;
    }

    //  FIXME: Или же ''?
    return 0;
}

function compare( a, b ) {
    var is_a = Array.isArray( a );
    var is_b = Array.isArray( b );

    if ( is_a ) {
        if ( is_b ) {
            for ( var i = 0, l = a.length; i < l; i++ ) {
                if ( _cmp_scalar_and_array( a[ i ], b ) ) {
                    return true;
                }
            }

            return false;
        }

        return _cmp_scalar_and_array( b, a );

    } else {
        if ( is_b ) {
            return _cmp_scalar_and_array( a, b );
        }

        return ( a === b );
    }
}

function _cmp_scalar_and_array( scalar, array ) {
    for ( var i = 0, l = array.length; i < l; i++ ) {
        if ( array[ i ] === scalar ) {
            return true;
        }
    }

    return false;
}

runtime.as = array_step;
runtime.ss = star_step;
runtime.ass = array_star_step;
runtime.f = filter;
runtime.ts = to_string;
runtime.tn = to_number;
runtime.tc = to_comparable;
runtime.c = compare;
runtime.e = _external_bodies;
runtime.M = _method_bodies;
runtime.j = _jpaths;

//  ---------------------------------------------------------------------------------------------------------------  //

function compile( expr, id, scheme ) {
    var key = expr + '::' + id;

    if ( !scheme ) {
        scheme = scheme_default;
    }

    var compiled = scheme._cache[ key ];
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

        scheme._cache[ key ] = compiled;
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

        js = 'd=r;';
    }

    js += d_scheme.gen_prologue();

    var steps = ast.steps;
    for ( var i = 0, l = steps.length - 1; i <= l; i++ ) {
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
                var expr = step.expr;
                var exid = expr2func( expr, d_scheme.pred(), r_scheme, exprs );

                if ( expr._local ) {
                    //  Это предикат.
                    js += d_scheme.gen_pred( exid );
                } else {
                    //  Это индекс.
                    js += d_scheme.gen_index( exid );
                    d_scheme = d_scheme.index();
                }

                break;

            case 'method':
                var args = step.args;
                var js_args = '';
                for ( var i = 0, l = args.length; i < l; i++ ) {
                    if ( i ) {
                        js_args += ',';
                    }
                    js_args += ast2js( args[ i ], d_scheme, r_scheme, exprs );
                }

                var name = step.name;

                js += d_scheme.gen_method( name, js_args );
                d_scheme = d_scheme.method( name );

                break;
        }
    }

    js += d_scheme.gen_epilogue();

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
            for ( var i = 0, l = content.length; i < l;  i++ ) {
                var item = content[ i ];
                var item_js = ast2js( item, d_scheme, r_scheme, exprs );
                js += '+' + item._scheme.gen_to_string( item_js );
            }
            js += ')';

            ast._scheme = scheme_string;

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

            var left_js = ast2js( left, d_scheme, r_scheme, exprs);
            var right_js = ast2js( right, d_scheme, r_scheme, exprs );

            if ( op === '~~' ) {
                js = 'c(' + left_js + ',' + right_js + ')';

            } else if ( op === '!~' ) {
                js = '!c(' + left_js + ',' + right_js + ')';

            } else if ( op === '+' || op === '-' || op === '*' || op === '/' || op === '%' ) {
                left_js = left._scheme.gen_to_number( left_js );
                right_js = right._scheme.gen_to_number( right_js );

                ast._scheme = scheme_number;

            } else if ( op === '<' || op === '<=' || op === '>' || op === '>=' ) {
                left_js = left._scheme.gen_to_comparable( left_js );
                right_js = right._scheme.gen_to_comparable( right_js );

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
                no.error( 'Jpath "%s" not found', jid );
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
                no.error( 'Function %s() not defined', name );
            }

            var args = ast.args;
            js = 'e["' + name + '"](';
            for ( var i = 0, l = args.length; i < l; i++ ) {
                if ( i ) {
                    js += ',';
                }
                js += ast2js( args[ i ], d_scheme, r_scheme, exprs );
            }
            js += ')';

            ast._scheme = scheme;

            break;

        case 'filter':
            var exid = jpath2func( ast.jpath, d_scheme, r_scheme, exprs );
            js = 'e' + exid + '(' + ast2js( ast.expr, d_scheme, r_scheme, exprs ) + ',r,v)';
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
        scheme = _schemes[ def.scheme ] || scheme_default;
        body = def.body;
    }

    _external_schemes[ name ] = scheme;
    _external_bodies[ name ] = body;
};

//  ---------------------------------------------------------------------------------------------------------------  //




})();

