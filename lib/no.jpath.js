var no;
if (typeof window === 'undefined') {
    no = module.exports = require('./no.js');
} else {
    no = no || {};
}

(function() {

//  ---------------------------------------------------------------------------------------------------------------  //

//  Compiled expressions cache.
var _exprs = {};

//  Compiled jpaths cache.
var _jpaths = {};
//  The same, but keys are jid's (not jpaths).
var _jids = {};
//  Incremental counter for jid's.
var _jid = 1;
//
//  For example:
//
//      _jpaths = {
//          'j1': [ .... ], // compiled jpath.
//          'j2': [ .... ],
//          ...
//      };
//
//      _jids = {
//          '.foo.bar': 'j1', // jid of this jpath.
//          '.id': 'j2',
//          ...
//      };
//

//  ---------------------------------------------------------------------------------------------------------------  //

//  Compile (if it's not cached) and evaluate expression s.
//
no.jpath = function(s, data, vars) {
    var expr = _exprs[s];
    if (!expr) {
        //  expr isn't cached.
        expr = _exprs[s] = ast2func( str2ast(s) );
    }

    return expr(data, data, vars);
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Runtime
//  -------

//  Evaluate jpath with given jid.
//
no.jpath.$ = function(jid, data, root, vars) {
    var jpath = _jpaths[jid];
    //
    //  jpath is an array of steps. Each step consists of two items: type of step and additional info.
    //
    //      [ 1, 'foo', 1, 'bar', 5, 42 ]   //  '.foo.bar[42]
    //
    //  There are five types of steps:
    //
    //    * Nametest (.foo):
    //
    //          1, 'foo'
    //
    //    * Star (.*):
    //
    //          2, null
    //
    //    * Predicate ( [ .count > 0 ] ):
    //
    //          3, function(data, root, vars) { return ... }
    //
    //    * Global predicate or guard ( [ /.count > 0 ] ):
    //
    //          4, function(data, root, vars) { return ... }
    //
    //    * Index ( [42] ):
    //
    //          5, function(data, root, vars) { return 42; }
    //

    //  Intermediate result.
    //  We start with just data and apply steps for every item in current.
    var current = [ data ];
    //  m === current.length
    var m = 1;

    //  This is `current` for the next step (or final result if there's no more steps).
    var result;

    for (var i = 0, l = jpath.length; i < l; i += 2) {
        var step = jpath[i + 1];

        result = [];
        switch ( jpath[i] ) {
            case 1:
                //  Nametest (.foo):
                for (var j = 0; j < m; j++) {
                    //  Make step for every current[j].
                    nametest( step, current[j] );
                }
                break;

            case 2:
                //  Star (.*):
                for (var j = 0; j < m; j++) {
                    var node = current[j];
                    //  The same as in case 1, but we make step for every key in current[j].
                    for (var key in node) {
                        nametest(key, node);
                    }
                }
                break;

            case 3:
                //  Predicate ( [ .foo ] ):
                for (var j = 0; j < m; j++) {
                    var node = current[j];
                    //  step is a function returning boolean value.
                    //  False means we should skip this item.
                    if ( step(node, root, vars) ) {
                        result.push(node);
                    }
                }
                break;

            case 4:
                //  Global predicate or guard ( [ /.foo ] ):

                //  Evaluate step in global context (data === root).
                if ( !step(root, root, vars) ) {
                    //  Nothing found.
                    return [];
                }
                //  Just skip this step.
                result = current;
                break;

            case 5:
                //  Index ( [ 42 ] ):
                var index = step(data, root, vars);
                //  FIXME: Check if splice() is faster.
                var r = current[index];
                result = (r === undefined) ? [] : [ r ];

        }

        m = result.length;
        if (!m) {
            //  Result is empty array -- nothing found.
            break;
        }

        current = result;
    }

    return result;

    function nametest(name, data) {
        //  Example:
        //
        //      data = {
        //          foo: { ... }, // it could be a number, string etc.
        //          bar: [ ... ]
        //      };
        //
        //  If name === 'foo', we push data['foo'] to result.
        //  If name === 'bar', we push every item in data['bar'] to result.
        //  If name === 'boo', we do nothing.
        //
        var r = data[name];
        if (r != null) {
            if (r instanceof Array) {
                result = result.concat(r);
            } else {
                result.push(r);
            }
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  nodeset -> boolean
//
no.jpath.n2b = function(nodeset) {
    //  FIXME: Странное условие.
    return (!nodeset && nodeset.length > 0) ? false : !!nodeset[0];
};

//  nodeset -> scalar
//
no.jpath.n2s = function(nodeset) {
    return (!nodeset.length) ? '' : nodeValue( nodeset[0] );
};

//  scalar -> boolean
//
no.jpath.s2b = function(scalar) {
    return !!scalar;
};

//  Compare two nodesets.
//
no.jpath.nn = function(left, right) {
    for (var i = 0, l = left.length; i < l; i++) {
        if ( no.jpath.sn( nodeValue( left[i] ), right ) ) {
            return true;
        }
    }
    return false;
};

//  Compare scalar and nodeset.
//
no.jpath.sn = function(scalar, nodeset) {
    for (var i = 0, l = nodeset.length; i < l; i++) {
        if ( scalar == nodeValue( nodeset[i] ) ) {
            return true;
        }
    }
    return false;
};

//  Scalar value of node.
//
function nodeValue(node) {
    return (typeof node === 'object') ? '' : node;
}


//  ---------------------------------------------------------------------------------------------------------------  //

//  Parser
//  ------

var TOKEN_SELF = /^\.(?![a-zA-Z_*.[])/;
var TOKEN_ROOT = /^\/(?![.[])/;
var TOKEN_BINOP = /^(?:\+|-|\*|\/|%|==|!=|<=|>=|<|>|&&|\|\|)/;
var TOKEN_UNOP = /^(?:\+|-|!)/;
var TOKEN_DIGIT = /^[0-9]/;

var TOKEN_ID = /^[a-zA-Z_][a-zA-Z0-9-_]*/;
var TOKEN_NUMBER = /^[0-9]+(?:\.[0-9]+)?/;
var TOKEN_CHARS = /^[^"{]+/;

//  Types.
//
var TYPE_SCALAR = 's';
var TYPE_NODESET = 'n';
var TYPE_BOOL = 'b';

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

function str2ast(s) {
    //  Current position in string s.
    var p = 0;
    //  Current portion of s ( cur === s.substr(p) ).
    var cur = s;

    //  We start at root rule: expr.
    var ast = parse(r_expr);

    if (cur) {
        error('End of string expected');
    }

    return ast;


    //  ### Grammar rules


    //  jpath := '.' | '/' | '/'? step+

    function r_jpath() {

        if ( test(TOKEN_SELF) ) {
            next();

            return {
                _id: 'self',
                _type: TYPE_NODESET,
                _local: true
            };
        }

        if ( test(TOKEN_ROOT) ) {
            next();

            return {
                _id: 'root',
                _type: TYPE_NODESET
            };
        }

        var abs;
        if ( la() === '/') {
            next();
            abs = true;
        }

        var steps = [];
        while (1) {
            var la_ = la();
            if (la_ === '.') {
                steps.push( parse(r_step) );
            } else if (la_ === '[') {
                steps.push( parse(r_pred) );
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
    }


    //  step := '.' pred | '.*' | '.' ID

    function r_step() {
        next();

        var la_ = la();

        if ( la_ === '[' ) {
            return parse(r_pred);
        }

        if ( la_ === '*' ) {
            next();

            return {
                _id: 'star'
            };
        }

        return {
            _id: 'nametest',

            nametest: match(TOKEN_ID)
        };
    }


    //  pred := '[' expr ']'

    function r_pred() {
        next();
        skip();
        var expr = parse(r_expr);
        skip();
        eat(']');

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


    //  expr := unary ( BIN_OP unary )*

    function r_expr() {
        //  Here we have list of expressions (arguments) and operators.
        //  We need to group them according to operator's priorities.

        //  There are two stacks. One for operators:
        var ops = [];
        //  And one for arguments. There should be at least one argument so we parse it now:
        var args = [ parse(r_unary) ];
        skip();

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
        while (( op = test(TOKEN_BINOP) )) {
            next(op.length);
            skip();

            var p = BINOPS[op];
            //  Next op has less or equal priority than top of `ops`.
            if (p <= cp) {
                //  Reduce.
                reduce(p);
            }
            //  Shift.
            ops.unshift(op);
            args.unshift( parse(r_unary) );
            skip();
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
    }


    //  unary := UNOP? unary | primary

    function r_unary() {
        var op;
        if (( op = test(TOKEN_UNOP) )) {
            next();
            var expr = parse(r_unary);

            return {
                _id: 'unop',
                //  Type of '!' is boolean, '+' and '-' -- scalar.
                _type: (op === '!') ? TYPE_BOOL : TYPE_SCALAR,
                _local: expr._local,

                op: op,
                expr: expr
            };
        }

        return parse(r_primary);
    }


    //  primary := string | jpath | number | '(' expr ')' | var

    function r_primary() {
        var la_ = la();

        if ( la_ === '"' ) {
            return r_string();
        }

        if ( la_ === '.' || la_ === '/' ) {
            return parse(r_jpath);
        }

        if ( la_ === '(' ) {
            next();
            skip();
            var expr = parse(r_expr);
            skip();
            eat(')');

            return {
                _id: 'subexpr',
                _type: expr._type,
                _local: expr._local,

                expr: expr
            }
        }

        if ( test(TOKEN_DIGIT) ) {
            return {
                _id: 'number',
                _type: TYPE_SCALAR,

                value: match(TOKEN_NUMBER)
            };
        }

        var name = match(TOKEN_ID);

        if ( la() === '.' ) {
            return {
                _id: 'filter',
                _type: 'nodeset',

                name: name,
                jpath: parse(r_jpath)
            };
        }

        return {
            _id: 'var',
            _type: TYPE_SCALAR,

            name: name
        };
    }

    function r_string() {
        eat('"');

        var parts = [];
        var c;
        var str = '';
        while ( (( c = la() )) && c !== '"' ) {
            switch (c) {
                case '{':
                    pushStr();

                    eat('{');
                    skip();
                    parts.push( parse(r_expr) );
                    skip();
                    eat('}');

                    break;

                default:
                    str += match(TOKEN_CHARS);
            }
        }
        pushStr();

        eat('"');

        return {
            _id: 'string',
            _type: TYPE_SCALAR,

            value: parts
        };

        function pushStr() {
            if (str) {
                parts.push({
                    _id: 'string_literal',

                    value: str
                });
                str = '';
            }
        }
    }


    //  ### Parse utils

    //  Call rule and then skip spaces.
    function parse(rule) {
        var start = p;
        var r = rule();
        //  Save substring corresponding to this ast.
        r._string = s.substr(start, p - start)
            .replace(/\s*$/, '');
        return r;
    }

    //  Skip spaces.
    function skip() {
        var r = /^\s+/.exec(cur);
        if (r) {
            next(r[0].length);
        }
    }

    //  Move current position.
    function next(l) {
        l || (l = 1);
        p += l;
        cur = cur.substr(l);
    }

    //  Lookahead. Return next `n` chars.
    function la(n) {
        return cur.substr(0, n || 1);
    }

    //  Test for token.
    function test(token) {
        var r = token.exec(cur);
        return r && r[0];
    }

    function eat(s) {
        var l = s.length;
        if ( la(l) !== s ) {
            expected(s);
        }
        next(l);
        return s;
    }

    //  Match token or test for it.
    function match(token) {
        var result = test(token);

        if (result) {
            //  Move current position.
            next(result.length);

            return result;
        }

        //  If we are not testing, then throw error.
        expected(token);
    }

    function expected(id) {
        error('Token ' + id + 'expected');
    }

    function error(msg) {
        throw Error(msg + ' at ' + p + ' : ' + cur);
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //
//  Compilation
//  ---------------------------------------------------------------------------------------------------------------  //

function ast2func(ast) {
    return Function('data', 'root', 'vars', 'return (' + ast2js(ast) + ')');
}

function compile_jpath(ast) {
    //  Check if it's compiled already.
    var jid = _jids[ast._string];

    if (!jid) {
        var r = [];

        //  See no.jpath.$.
        var steps = ast.steps;
        for (var i = 0, l = steps.length; i < l; i++) {
            var step = steps[i];

            var _id = step._id;
            if (_id === 'nametest') {
                r.push( 1, step.nametest );
            } else if (_id === 'star') {
                r.push( 2, null);
            } else {
                var n = 4;
                var expr = step.expr;
                switch (_id) {
                    case 'pred':
                        n = 3;
                        //  Cast `expr` to boolean.
                        expr._as = TYPE_BOOL;
                        break;
                    case 'index':
                        //  Cast `expr` to scalar.
                        expr._as = TYPE_SCALAR;
                        n = 5;
                }
                r.push( n, ast2func(expr) );
            }
        }

        //  Cache compiled jpath.
        jid = 'j' + _jid++;
        _jpaths[jid] = r;
        _jids[ast._string] = jid;
    }

    return jid;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function ast2js(ast) {
    var js;

    switch (ast._id) {

        case 'root':
            js = '[ root ]';
            break;

        case 'self':
            js = '[ data ]';
            break;

        case 'number':
            js = ast.value;
            break;

        case 'string_literal':
            js = '"' + ast.value + '"';
            break;

        case 'string':
            js = '(' + ast.value.map(function(value) {
                return ast2js(value);
            }).join(' + ') + ')';
            break;

        case 'var':
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
    if (ast._as && ast._as !== ast._type) {
        return 'no.jpath.' + ast._type + '2' + ast._as + '(' + js + ')';
    }

    function jpath2js(jid, data) {
        return 'no.jpath.$("' + jid + '", ' + data + ', root, vars)';
    }

    return js;
}

//  ---------------------------------------------------------------------------------------------------------------  //

})();

