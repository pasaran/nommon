var no = (typeof window !== 'undefined') ? no || {} : require('./no.js');

(function() {

//  ---------------------------------------------------------------------------------------------------------------  //

var _exprs = {};

var _jpaths = {};
var _jids = {};
var _jid = 1;

//  ---------------------------------------------------------------------------------------------------------------  //

no.jpath = function(s, data, vars) {
    var expr = _exprs[s];
    if (!expr) {
        expr = _exprs[s] = compile(s);
    }

    return expr(data, data, vars);
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Runtime
//  ---------------------------------------------------------------------------------------------------------------  //

no.jpath._select = function(jid, data, root, vars) {
    var jpath = _jpaths[jid];

    var current = [ data ];
    var m = 1;

    var result;
    for (var i = 0, l = jpath.length; i < l; i += 2) {
        result = [];

        var type = jpath[i];
        var step = jpath[i + 1];

        switch (type) {
            case 1:
                //  .foo
                for (var j = 0; j < m; j++) {
                    nametest( step, current[j] );
                }
                break;

            case 2:
                //  .*
                for (var j = 0; j < m; j++) {
                    var node = current[j];
                    for (var key in node) {
                        nametest(key, node);
                    }
                }
                break;

            case 3:
                //  [ .foo ]
                for (var j = 0; j < m; j++) {
                    var node = current[j];
                    if ( step(node, root, vars) ) {
                        result.push(node);
                    }
                }
                break;

            case 4:
                //  [ /.foo ]
                if ( !step(root, root, vars) ) {
                    return [];
                }
                result = current;
                break;

            case 5:
                //  [ 42 ]
                var index = step(data, root, vars);
                //  FIXME: Не будет ли splice быстрее?
                var r = current[index];
                result = (r === undefined) ? [] : [ r ];

        }

        current = result;
        m = result.length;

        if (!m) { return []; }
    }

    return result;

    function nametest(name, data) {
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

no.jpath._nodeset2bool = function(nodeset) {
    return (!nodeset && nodeset.length > 0) ? false : !!nodeset[0];
};

no.jpath._nodeset2scalar = function(nodeset) {
    return (!nodeset.length) ? '' : nodeValue( nodeset[0] );
};

no.jpath._scalar2bool = function(scalar) {
    return !!scalar;
};

no.jpath._cmpNN = function(left, right) {
    for (var i = 0, l = left.length; i < l; i++) {
        if ( no.jpath._cmpSN( nodeValue( left[i] ), right ) ) {
            return true;
        }
    }
    return false;
};

no.jpath._cmpSN = function(scalar, nodeset) {
    for (var i = 0, l = nodeset.length; i < l; i++) {
        if ( scalar == nodeValue( nodeset[i] ) ) {
            return true;
        }
    }
    return false;
};

function nodeValue(node) {
    return (typeof node === 'object') ? '' : node;
}


//  ---------------------------------------------------------------------------------------------------------------  //
//  Parser
//  ---------------------------------------------------------------------------------------------------------------  //

var TOKEN = {
    ID: /^[a-zA-Z_][a-zA-Z0-9-_]*/,
    SELF: /^\.(?![a-zA-Z_*.])/,
    ROOT: /^\/(?![.\[])/,
    DIGIT: /^[0-9]/,
    NUMBER: /^[0-9]+(?:\.[0-9]+)?/,
    STRING: /^"(?:\\"|\\\\|[^"\\])*"/,
    BINOP: /^(?:\+|-|\*|\/|%|==|!=|<=|>=|<|>|&&|\|\|)/,
    UNOP: /^(?:\+|-|!)/
};

var TYPE_SCALAR = 'scalar';
var TYPE_NODESET = 'nodeset';
var TYPE_BOOL = 'bool';

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

function parse(s) {
    var p = 0;
    var cur = s;

    skip();
    var r = parse(r_expr);

    if (cur) {
        error('End of string expected');
    }

    return r;

    //  rules
    //  -----------------------------------------------------------------------

    //  jpath := '.' | '/' | '/'? step+

    function r_jpath() {

        if ( test('SELF') ) {
            match('.');

            return {
                _id: 'self',
                _type: TYPE_NODESET,
                _local: true
            };
        }

        if ( test('ROOT') ) {
            match('/');

            return {
                _id: 'root',
                _type: TYPE_NODESET
            };
        }

        var abs;
        if ( la() === '/') {
            match('/');
            abs = true;
        }

        var steps = [];
        //  FIXME: Нужно проверять, что хотя бы один step есть.
        while ( la() === '.' || la() === '[' ) {
            steps.push( parse(r_step) );
        }

        return {
            _id: 'jpath',
            _type: TYPE_NODESET,
            _local: !abs,

            abs: abs,
            steps: steps
        };
    }

    //  -----------------------------------------------------------------------

    //  step := pred | '.*' | '.' ID

    function r_step() {
        if ( la() === '[' ) {
            return parse(r_pred);
        }

        match('.');
        if ( la() === '*' ) {
            match('*');

            return {
                _id: 'star'
            };
        }

        var nametest = match('ID');
        return {
            _id: 'nametest',

            nametest: nametest
        };
    }

    //  -----------------------------------------------------------------------

    //  pred := '[' expr ']'

    function r_pred() {
        match('[');
        var expr = parse(r_expr);
        match(']');

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

    //  -----------------------------------------------------------------------

    //  expr := unary ( BIN_OP unary )?

    function r_expr() {
        var args = [ parse(r_unary) ];
        var ops = [];

        var op;
        var cp = 0;
        while (( op = test('BINOP') )) {
            match('BINOP');

            var p = BINOPS[op];
            if (p < cp) {
                reduce(p);
            }
            ops.unshift(op);
            args.unshift( parse(r_unary) );
            cp = p;
        }
        reduce(0);

        return args[0];

        function reduce(p) {
            var op, left, right;
            while ( (( op = ops[0] )) && (BINOPS[op] > p) ) {
                right = args.shift();
                left = args.shift();
                args.unshift({
                    _id: 'binop',
                    _type: ('+-*/%'.indexOf(op) > -1) ? TYPE_SCALAR : TYPE_BOOL,
                    _local: left._local || right._local,

                    op: ops.shift(),
                    left: left,
                    right: right
                });
            }
        }
    }

    function r_unary() {
        var op;
        if (( op = test('UNOP') )) {
            match('UNOP');
            var expr = parse(r_unary);

            return {
                _id: 'unop',
                _type: (op === '!') ? TYPE_BOOL : TYPE_SCALAR,
                _local: expr._local,

                op: op,
                expr: expr
            };
        }

        return parse(r_primary);
    }


    //  -----------------------------------------------------------------------

    //  primary := string | jpath | number | '(' expr ')' | var

    function r_primary() {
        var la_ = la();
        if ( la_ === '"' ) {
            return {
                _id: 'string',
                _type: TYPE_SCALAR,

                value: match('STRING')
            };
        }

        if ( la_ === '.' || la_ === '/' ) {
            return parse(r_jpath);
        }

        if ( la_ === '(' ) {
            match('(');
            var expr = parse(r_expr);
            match(')');

            return {
                _id: 'subexpr',
                _type: expr._type,
                _local: expr._local,

                expr: expr
            }
        }

        if ( test('DIGIT') ) {
            return {
                _id: 'number',
                _type: TYPE_SCALAR,

                value: match('NUMBER')
            };
        }

        return {
            _id: 'var',
            _type: TYPE_SCALAR,

            name: match('ID')
        };
    }


    //  Parse utils
    //  -----------------------------------------------------------------------

    //  Call rule and then skip spaces.
    function parse(rule) {
        var start = p;
        var r = rule();
        r._string = s.substr(start, p - start)
            .replace(/\s*$/, '');
        // skip();
        return r;
    }

    //  Skip spaces.
    function skip() {
        var r = /^\s+/.exec(cur);
        if (r) {
            next(r[0].length);
        }
    }

    function next(l) {
        p += l;
        cur = cur.substr(l);
    }

    //  Lookahead
    function la(n) {
        return cur.substr(0, n || 1);
    }

    //  Test for token.
    function test(id) {
        return match(id, true);
    }

    //  Match token or test for it.
    function match(id, test) {
        var result;

        var token = TOKEN[id];
        if (token) {
            var r = token.exec(cur);
            if (r) {
                result = r[0];
            }
        } else {
            var l = id.length;
            if ( la(l) === id ) {
                result = id;
            }
        }

        if (result === undefined) {
            if (test) {
                return null;
            }
            error('Token ' + id + ' expected');
        }

        if (!test) {
            next(result.length);
            skip();
        }

        return result;
    }

    function error(msg) {
        throw Error(msg + ' at ' + p + ' : ' + cur);
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //
//  Compilation
//  ---------------------------------------------------------------------------------------------------------------  //

function compile(s) {
    var ast = parse(s);

    var js = ast2js(ast);

    return Function('data', 'root', 'vars', 'return (' + js + ')');
}

function compile_jpath(ast) {
    var r = [];

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
                    expr._as = TYPE_BOOL;
                    break;
                case 'index':
                    expr._as = TYPE_SCALAR;
                    n = 5;
            }
            var js = 'return (' + ast2js(expr) + ');';
            r.push( n, Function( 'data', 'root', 'vars', js) );
        }
    }

    var jid = 'j' + _jid++;
    _jpaths[jid] = r;
    _jids[ast._string] = jid;

    return jid;

}

//  ---------------------------------------------------------------------------------------------------------------  //

function ast2js(ast) {
    var js;

    switch (ast._id) {

        case 'root':
            js = 'root';
            break;

        case 'self':
            js = '[ data ]';
            break;

        case 'number':
        case 'string':
            js = ast.value;
            break;

        case 'var':
            js = 'vars["' + ast.name + '"]';
            break;

        case 'unop':
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
                    as = TYPE_BOOL;
                    break;

                case '==':
                case '!=':
                    if ( lt !== rt && (lt === TYPE_BOOL || rt === TYPE_BOOL) ) {
                        as = TYPE_BOOL;
                    }
                    break;
                default:
                    as = TYPE_SCALAR;
            }
            if (as) {
                l._as = r._as = as;
            }

            var ljs = ast2js(l);
            var rjs = ast2js(r);

            if (op === '==' || op === '!=') {
                if (lt === TYPE_NODESET || rt === TYPE_NODESET) {
                    var type = (lt === rt) ? 'NN' : 'SN';
                    if (rt === TYPE_SCALAR) {
                        var t = rjs;
                        rjs = ljs;
                        ljs = t;
                    }
                    js = 'no.jpath._cmp' + type + '(' + ljs + ', ' + rjs + ')';
                }
                if (js && op === '!=') {
                    js = '!(' + js + ')';
                }
            }

            if (js === undefined) {
                js = '(' + ljs + ' ' + ast.op + ' ' + rjs + ')';
            }

            break;

        case 'subexpr':
            js = '(' + ast2js(ast.expr) + ')';
            break;

        case 'jpath':
            var jid = _jids[ast._string];
            if (!jid) {
                jid = compile_jpath(ast);
            }

            var data = (ast.abs) ? 'root' : 'data';
            js = 'no.jpath._select("' + jid + '", ' + data + ', root, vars)';
    }

    if (ast._as && ast._as !== ast._type) {
        return 'no.jpath._' + ast._type + '2' + ast._as + '(' + js + ')';
    }

    return js;
}

//  ---------------------------------------------------------------------------------------------------------------  //

})();

