var no;
if (typeof window === 'undefined') {
    no = require('./no.js');
    require('./no.parser.js');
} else {
    no = no || {};
}

(function() {

//  ---------------------------------------------------------------------------------------------------------------  //
//  Grammar
//  ---------------------------------------------------------------------------------------------------------------  //

//  ---------------------------------------------------------------------------------------------------------------  //
//  Grammar consts
//  ---------------------------------------------------------------------------------------------------------------  //

//  Types.
//
var TYPE_SCALAR = 'scalar';
var TYPE_NODESET = 'nodeset';
var TYPE_BOOL = 'boolean';

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
    '==': 3,
    '!=': 3,
    '&&': 2,
    '||': 1
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Grammar tokens
//  ---------------------------------------------------------------------------------------------------------------  //

var tokens = {};

//  ---------------------------------------------------------------------------------------------------------------  //

tokens.SELF = /^\.(?![a-zA-Z_*.[])/;
tokens.ROOT = /^\/(?![.[])/;
tokens.BINOP = /^(?:\+|-|\*|\/|%|==|!=|<=|>=|<|>|&&|\|\|)/;
tokens.UNOP = /^(?:\+|-|!)/;
tokens.DIGIT = /^[0-9]/;
tokens.QUOTE = /^['"]/;

tokens.ID = /^[a-zA-Z_][a-zA-Z0-9-_]*/;
tokens.NUMBER = /^[0-9]+(?:\.[0-9]+)?/;
tokens.CHARS = /^[^"{}\\]+/;

//  ---------------------------------------------------------------------------------------------------------------  //
//  Grammar rules
//  ---------------------------------------------------------------------------------------------------------------  //

var rules = {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  expr := unary ( BIN_OP unary )*

rules.expr = function() {
    //  Here we have list of expressions (arguments) and operators.
    //  We need to group them according to operator's priorities.

    //  There are two stacks. One for operators:
    var ops = [];
    //  And one for arguments. There should be at least one argument so we parse it now:
    var args = [ this.parse('unary') ];
    this.skip();

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
    //      reduce(5)
    //      args: [ '(a * b)' ]         ops: []
    //      shift
    //      args: [ 'c', '(a * b)' ]    ops: [ '+' ]
    //      reduce(0)
    //      args: [ '((a * b) + c)' ]   ops: []
    //
    while (( op = this.test('BINOP') )) {
        this.move(op.length);
        this.skip();

        var p = BINOPS[op];
        //  Next op has less or equal priority than top of `ops`.
        if (p <= cp) {
            //  Reduce.
            reduce(p);
        }
        //  Shift.
        ops.unshift(op);
        args.unshift( this.parse('unary') );
        this.skip();

        //  Update cp.
        cp = p;
    }
    //  Reduce all remaining operators.
    reduce(0);

    //  Result is on top of the `args`.
    return args[0];

    function reduce(p) {
        var op, left, right;
        //  If top of `ops` has greater or equal priority than `p` -- reduce it.
        while ( (( op = ops[0] )) && (BINOPS[op] >= p) ) {
            //  Pop two arguments.
            right = args.shift();
            left = args.shift();
            //  Push back result of `op`.
            args.unshift({
                _id: 'binop',
                //  Type of '+', '-', '*', '/', '%' is scalar. Boolean otherwise.
                _type: ('+-*/%'.indexOf(op) > -1) ? TYPE_SCALAR : TYPE_BOOL,
                //  If either of left or right is local, then binary expression is local too.
                _local: left._local || right._local,

                //  Do not forget to pop `op` out of `ops`.
                op: ops.shift(),
                left: left,
                right: right
            });
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  unary := UNOP? unary | primary

rules.unary = function() {
    var op;
    if (( op = this.test('UNOP') )) {
        this.move();

        var expr = this.parse('unary');

        return {
            _id: 'unop',
            //  Type of '!' is boolean, '+' and '-' -- scalar.
            _type: (op === '!') ? TYPE_BOOL : TYPE_SCALAR,
            _local: expr._local,

            op: op,
            expr: expr
        };
    }

    return this.parse('primary');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  primary := string | jpath | subexpr | number | filter | var

rules.primary = function() {
    var la = this.la();

    switch (la) {
        case '"':
            return this.parse('string');

        case '.':
        case '/':
            return this.parse('jpath');

        case '(':
            return this.parse('subexpr');
    }

    if ( this.test('DIGIT') ) {
        return {
            _id: 'number',
            _type: TYPE_SCALAR,

            value: this.match('NUMBER')
        };
    }

    var name = this.match('ID');

    if ( this.test('.') ) {
        return {
            _id: 'filter',
            _type: 'nodeset',

            name: name,
            jpath: this.parse('jpath')
        };
    }

    return {
        _id: 'var',
        _type: TYPE_SCALAR,

        name: name
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  subexpr := '(' expr ')'

rules.subexpr = function() {
    this.move();
    this.skip();
    var expr = this.parse('expr');
    this.skip();
    this.match(')');

    return {
        _id: 'subexpr',
        _type: expr._type,
        _local: expr._local,

        expr: expr
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  jpath := '.' | '/' | '/'? step+

rules.jpath = function() {

    if ( this.test('SELF') ) {
        this.move();

        return {
            _id: 'self',
            _type: TYPE_NODESET,
            _local: true
        };
    }

    if ( this.test('ROOT') ) {
        this.move();

        return {
            _id: 'root',
            _type: TYPE_NODESET
        };
    }

    var abs;
    if ( this.test('/') ) {
        this.move();
        abs = true;
    }

    var steps = [];
    while (1) {
        var la = this.la();

        if (la === '.') {
            steps.push( this.parse('step') );
        } else if (la === '[') {
            var pred = this.parse('pred');
            if (pred._id === 'guard') {
                steps.unshift(pred);
            } else {
                steps.push(pred);
            }
        } else {
            break;
        }
    }

    return {
        _id: 'jpath',
        _type: TYPE_NODESET,
        _local: !abs,

        abs: abs,
        steps: steps
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  step := '.' pred | '.*' | '.' ID

rules.step = function() {
    this.move();

    var la = this.la();

    if (la === '[') {
        return this.parse('pred');
    }

    if (la === '*') {
        this.move();

        return {
            _id: 'star'
        };
    }

    return {
        _id: 'nametest',

        nametest: this.match('ID')
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  pred := '[' expr ']'

rules.pred = function() {
    this.move();
    this.skip();
    var expr = this.parse('expr');
    this.skip();
    this.match(']');

    //  There are three types of "predicates":
    //
    //    * Predicate. `expr` is local (i.e. it depends on current context).
    //      Basically it means that it contains at least one non-absolute jpath.
    //
    //    * Global predicate (or guard). `expr` is not local but it has boolean type.
    //
    //    * Index. Global non-boolean expression.
    //
    var _id = 'index';
    if (expr._local) {
        _id = 'pred';
    } else if (expr._type === TYPE_BOOL) {
        _id = 'guard';
    }

    return {
        _id: _id,

        expr: expr
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

rules.string = function() {
    this.match('"');
    var content = this.parse('string_content');
    this.match('"');

    return content;
};

var disymbols = {
    '{{': '{',
    '}}': '}',
    '\\"': '"',
    '\\\\': '\\'
    //  FIXME: Нужны ли тут \', \n, \t и т.д.?
};

rules.string_content = function() {
    var parts = [];
    var c;
    var str = '';

    while (this.s) {
        c = disymbols[ this.la(2) ];
        if (c) {
            str += c;
            this.move(2);
        } else {
            c = this.la();

            if (c === '"') {
                break;
            }

            if (c === '\\') {
                str += c;
                this.move();
            } else if (c === '{') {
                pushStr();

                this.move();
                this.skip();
                parts.push( this.parse('expr') );
                this.skip();
                this.match('}');
            } else {
                str += this.match('CHARS');
            }
        }
    }
    pushStr();

    return {
        _id: 'string',
        _type: TYPE_SCALAR,

        value: parts
    };

    function pushStr() {
        if (str) {
            parts.push({
                _id: 'string_literal',
                _type: TYPE_SCALAR,

                value: str
            });
            str = '';
        }
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //

var isArray = Array.isArray;

//  ---------------------------------------------------------------------------------------------------------------  //

var parser = new no.Parser(rules, tokens);

var _cache = {};

//  ---------------------------------------------------------------------------------------------------------------  //
//  no.jpath
//  ---------------------------------------------------------------------------------------------------------------  //

//  Compile (if it's not cached) and evaluate expression `expr`.
//
no.jpath = function(expr, data, vars) {
    var compiled = no.jpath.expr(expr);

    return compiled(data, data, vars);
};

//  NOTE: Возвращает функцию с сигнатурой:
//
//      function(data, root, vars) { ... }
//
//  При этом, обычно, root должен совпадать с data.
//
no.jpath.expr = function(expr) {
    var type = typeof expr;

    if (type === 'string') {
        return compileString(expr);
    }

    //  Object or array.
    if (expr && type === 'object') {
        return ( isArray(expr) ) ? compileArray(expr) : compileObject(expr);
    }

    //  Value.
    return function() {
        return expr;
    };
};

no.jpath.string = function(str) {
    return compileString(str, 'string_content');
};

//  ---------------------------------------------------------------------------------------------------------------  //

function compileString(expr, id) {
    var cached = _cache[expr];

    if (!cached) {
        //  expr isn't cached.
        cached = _cache[expr] = ast2func( parser.start(expr, id || 'expr') );
    }

    return cached;
}

function compileObject(obj) {
    var items = {};

    for (var key in obj) {
        items[key] = no.jpath.expr( obj[key] );
    }

    return function(data, root, vars) {
        var r = {};

        for (var key in items) {
            r[key] = items[key](data, root, vars);
        }

        return r;
    };
};

function compileArray(arr) {
    var items = [];

    var l = arr.length;
    for (var i = 0; i < l; i++) {
        items.push( no.jpath.expr( arr[i] ) );
    }

    return function(data, root, vars) {
        var r = [];

        for (var i = 0; i < l; i++) {
            r.push( items[i](data, root, vars) );
        }

        return r;
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Compiled jpaths cache.
var _jpaths = {};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Compilation
//  ---------------------------------------------------------------------------------------------------------------  //

function ast2func(ast) {
    return Function('node', 'root', 'vars', 'return (' + ast2js(ast) + ')');
}

function jpath2js(ast) {
    var r = '';

    var steps = ast.steps;
    for (var i = 0, l = steps.length; i < l; i++) {
        var step = steps[i];

        var id = step._id;
        switch (id) {
            case 'nametest':
                r += 'node = node.nametest("' + step.nametest + '");'
                break;

            case 'startest':
                r += 'node = node.startest();'
                break;

            case 'pred':
                //  Cast `expr` to boolean.
                step.expr._as = TYPE_BOOL;
                r += 'node = node.filter(function(node, root) { return (' + ast2js(step.expr) + '); }, root);';
                break;

            case 'index':
                //  Cast `expr` to scalar.
                step.expr._as = TYPE_SCALAR;
                r += 'node = node.index(' ast2js(step.expr) + ', root);';
                break;

            case 'guard':
                r += 'if (!(' + ast2js(step.expr) + ')) { return node.empty; }';
                break;
        }

        if (id !== 'guard') {
            r += 'if (node.isEmpty()) { return node; }';
        }
    }

    r += 'return node;';

    return Function('node', 'root', 'vars', r);
}

//  ---------------------------------------------------------------------------------------------------------------  //

function ast2js(ast) {
    var js;

    switch (ast._id) {

        case 'root':
            js = 'root';
            break;

        case 'self':
            js = 'node';
            break;

        case 'number':
            js = ast.value;
            break;

        case 'string_literal':
            js = JSON.stringify(ast.value);
            break;

        case 'string':
            //  FIXME: Убрать map.
            js = '(' + ast.value.map(function(value) {
                value._as = TYPE_SCALAR;
                return ast2js(value);
            }).join(' + ') + ')';
            break;

        case 'var':
            //  FIXME: Обернуть в new JNode().
            js = 'vars["' + ast.name + '"]';
            break;

        case 'unop':
            //  Cast expr to boolean ('!') or scalar ('+', '-').
            ast.expr._as = (ast.op === '!') ? TYPE_BOOL : TYPE_SCALAR;

            js = ast.op + '(' + ast2js(ast.expr) + ')';
            break;

        case 'binop':
            var l = ast.left;
            var r = ast.right;

            var lt = l._type;
            var rt = r._type;

            var op = ast.op;
            var as;
            switch (op) {
                case '&&':
                case '||':
                    //  Both operands should be boolean.
                    as = TYPE_BOOL;
                    break;

                case '==':
                case '!=':
                    if ( lt !== rt && (lt === TYPE_BOOL || rt === TYPE_BOOL) ) {
                        //  We compare nodeset or scalar to boolean.
                        //  Both operands should be boolean then.
                        as = TYPE_BOOL;
                    }
                    break;

                default:
                    //  Both operands should be scalar.
                    as = TYPE_SCALAR;
            }
            if (as) {
                //  Cast both operands if `as`.
                l._as = r._as = as;
            }

            var ljs = ast2js(l);
            var rjs = ast2js(r);

            if (op === '==' || op === '!=') {
                //  Special case: compare nodeset to nodeset or scalar.
                if (lt === TYPE_NODESET || rt === TYPE_NODESET) {
                    var type = (lt === rt) ? 'nn' : 'sn';
                    if (rt === TYPE_SCALAR) {
                        var t = rjs;
                        rjs = ljs;
                        ljs = t;
                    }
                    js = 'no.jpath.' + type + '(' + ljs + ', ' + rjs + ')';
                }
                if (js && op === '!=') {
                    js = '!(' + js + ')';
                }
            }

            if (js === undefined) {
                //  Usual binary operation.
                js = '(' + ljs + ' ' + ast.op + ' ' + rjs + ')';
            }

            break;

        case 'subexpr':
            js = '(' + ast2js(ast.expr) + ')';
            break;

        case 'jpath':
            //  If it's an absolute jpath, then we should use root instead of data.
            js = jpath2js( compile_jpath(ast), (ast.abs) ? 'root' : 'data' );
            break;

        case 'filter':
            js = jpath2js( compile_jpath(ast.jpath), 'vars["' + ast.name + '"]' );
    }

    //  Typecasting.
    if (ast._as && ast._type === TYPE_NODESET && ast._as !== ast._type) {
        js = '(' + js + ').' + ast._as + '()';
    }

    return js;
}

//  ---------------------------------------------------------------------------------------------------------------  //

})();

