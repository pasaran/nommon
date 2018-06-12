function exprs2js( exprs ) {
    var js = '';

    for ( var i = 0, l = exprs.length; i < l; i++ ) {
        js += 'function e' + i + '(d,r,v){' + exprs[ i ] + '}\n';
    }

    return js;
}

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

        case 'func':
            var name = ast.name;

            js = 'R.f(v,"' + name + '")(';
            var args = ast.args;
            for ( var i = 0, l = args.length; i < l; i++ ) {
                if ( i ) {
                    js += ',';
                }
                js += ast2js( args[ i ], exprs );
            }

            js += ')';

            break;

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

module.exports = {
    exprs2js: exprs2js,
    expr2func: expr2func,
    jpath2func: jpath2func,
};

