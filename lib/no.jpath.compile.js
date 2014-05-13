//  ---------------------------------------------------------------------------------------------------------------  //
//  Compilation
//  ---------------------------------------------------------------------------------------------------------------  //

function compile(ast) {
    var exprs = [];

    var p = (ast._id === 'jpath') ? jpath2func(ast, exprs) : expr2func(ast, exprs);

    var r = '';
    for (var i = 0; i <= p; i++) {
        r += 'function t' + i + '(node, root, vars, funcs) {\n' + exprs[i] + '\n}\n\n';
    }
    r += 'return function(data, vars, funcs) {\nvar node = new no.JNode(data);\nreturn t' + p + '(node, node, vars, funcs);\n}\n';

    //  console.log(r);
    return Function('no', r)(no);
}

//  ---------------------------------------------------------------------------------------------------------------  //

function expr2func(ast, exprs) {
    var r = 'return (' + ast2js(ast, exprs) + ');';

    return exprs.push(r) - 1;
}


function jpath2func(ast, exprs) {
    var r = '';
    if (ast.abs) {
        //  If it's an absolute jpath, then we should use root instead of data.
        r += 'node = root;\n';
    }

    var steps = ast.steps;
    for (var i = 0, l = steps.length; i < l; i++) {
        var step = steps[i];

        var id = step._id;
        switch (id) {
            case 'nametest':
                r += 'node = node.nametest("' + step.nametest + '");\n';
                break;

            case 'star':
                r += 'node = node.startest();\n';
                break;

            case 'pred':
            case 'index':
                //  Cast `expr` to boolean or scalar.
                step.expr._as = (id === 'pred') ? TYPE_BOOL : TYPE_SCALAR;
                var p = expr2func(step.expr, exprs);
                r += 'node = node.' + id + '(t' + p + ', root, vars, funcs);\n';
                break;

            case 'guard':
                r += 'if (!(' + ast2js(step.expr, exprs) + ')) { return node.empty; }\n';
                break;
        }

        if (id !== 'guard') {
            r += 'if (node.isEmpty()) { return node.empty; }\n';
        }
    }

    r += 'return node;';

    return exprs.push(r) - 1;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function ast2js(ast, exprs) {
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
                return ast2js(value, exprs);
            }).join(' + ') + ')';
            break;

        case 'var':
            js = '(new no.JNode(vars["' + ast.name + '"]))';
            break;

        case 'func':
            js = 'funcs["' + ast.name + '"](';
            for (var i = 0, l = ast.args.length; i < l; i++) {
                var arg = ast.args[i];
                arg._as = TYPE_SCALAR;
                js += (i) ? ',' : '';
                js += ast2js(arg, exprs);
            }
            js += ')';
            break;

        case 'unop':
            //  Cast expr to boolean ('!') or scalar ('+', '-').
            ast.expr._as = (ast.op === '!') ? TYPE_BOOL : TYPE_SCALAR;

            js = ast.op + '(' + ast2js(ast.expr, exprs) + ')';
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
                    if (lt === TYPE_BOOL && rt === TYPE_BOOL) {
                        //  (.foo > 42) || (.bar < 42)
                        //  Both operands should be boolean.
                        as = TYPE_BOOL;
                    } else {
                        //  .foo || 42
                        as = TYPE_SCALAR;
                    }
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

            var ljs = ast2js(l, exprs);
            var rjs = ast2js(r, exprs);

            if (op === '==' || op === '!=') {
                //  Special case: compare nodeset to nodeset or scalar.
                if (lt === TYPE_NODESET || rt === TYPE_NODESET) {
                    //  (nodeset, nodeset) or (nodeset, scalar)
                    if (lt === TYPE_SCALAR) {
                        var t = rjs;
                        rjs = ljs;
                        ljs = t;
                    }

                    var type = (lt === rt) ? 'N' : 'S';
                    js = '(' + ljs + ').cmp' + type + '(' + rjs + ')';
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
            js = '(' + ast2js(ast.expr, exprs) + ')';
            break;

        case 'jpath':
            var p = jpath2func(ast, exprs);
            js = 't' + p + '(node, root, vars, funcs)';
            break;

        case 'filter':
            var p = jpath2func(ast.jpath, exprs);
            js = 't' + p + '(new no.JNode(vars["' + ast.name + '"]), root, vars, funcs)';
            break;
    }

    //  Typecasting.
    if (ast._as && ast._as !== ast._type) {
        if (ast._type === TYPE_NODESET) {
            js = '(' + js + ').' + ast._as + '()';
        } else if (ast._type === TYPE_SCALAR) {
            js = '!!(' + js + ')';
        }
    }

    return js;
}
