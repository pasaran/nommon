var no = no || require('./no.base.js');

if ( no.de ) {
    require('./no.parser.js');

    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

(function() {

//  ---------------------------------------------------------------------------------------------------------------  //

//  ---------------------------------------------------------------------------------------------------------------  //

var parser = new no.Parser(rules, tokens);

var _cache = {};

//  ---------------------------------------------------------------------------------------------------------------  //
//  no.jpath
//  ---------------------------------------------------------------------------------------------------------------  //

no.jpath = function(expr, data, vars, funcs) {
    return no.jpath.toScalar( no.jpath.expr(expr)(data, vars, funcs) );
};

no.jpath.raw = function(expr, data, vars, funcs) {
    return no.jpath.expr(expr)(data, vars, funcs);
};

no.jpath.scalar = function(expr) {
    var compiled = no.jpath.expr(expr);

    return function(data, vars, funcs) {
        return no.jpath.toScalar( compiled(data, vars, funcs) );
    };
};

no.jpath.boolean = function(expr) {
    var compiled = no.jpath.expr(expr);

    return function(data, vars, funcs) {
        return no.jpath.toBoolean( compiled(data, vars, funcs) );
    };
};

no.jpath.string = function(str) {
    return compileString(str, 'string_content');
};

//  Возвращает функцию с сигнатурой:
//
//      function(data, vars, funcs) { ... }
//
no.jpath.expr = function(expr) {
    var type = typeof expr;

    if (type === 'string') {
        return compileString(expr, 'expr');
    }

    //  Object or array.
    if (expr && type === 'object') {
        return ( Array.isArray(expr) ) ? compileArray(expr) : compileObject(expr);
    }

    //  Value.
    return function() {
        return expr;
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.jpath.toScalar = function(result) {
    if (result instanceof JNode) {
        return result.data;
    } else if (result instanceof JNodeset) {
        return ( result.isEmpty() ) ? undefined : result.toArray();
    } else {
        return result;
    }
};

no.jpath.toBoolean = function(result) {
    if (result instanceof JNode || result instanceof JNodeset) {
        return result.boolean();
    } else {
        return result;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

function compileString(expr, id) {
    var key = expr + '::' + id;

    //  FIXME: Разложить по разным кэшам?
    var cached = _cache[key];

    if (!cached) {
        //  expr isn't cached.
        cached = _cache[key] = compile( parser.start(expr, id) );
    }

    return cached;
}

function compileObject(obj) {
    var items = {};

    for (var key in obj) {
        items[key] = no.jpath.expr( obj[key] );
    }

    //  FIXME: Компилировать сразу в функцию без цикла?
    return function(data, vars, funcs) {
        var r = {};

        for (var key in items) {
            r[key] = no.jpath.toScalar( items[key](data, vars, funcs) );
        }

        return r;
    };
}

function compileArray(arr) {
    var items = [];

    var l = arr.length;
    for (var i = 0; i < l; i++) {
        items.push( no.jpath.expr( arr[i] ) );
    }

    //  FIXME: Компилировать сразу в функцию без цикла?
    return function(data, vars, funcs) {
        var r = [];

        for (var i = 0; i < l; i++) {
            r.push( no.jpath.toScalar( items[i](data, vars, funcs) ) );
        }

        return r;
    };
}



//  ---------------------------------------------------------------------------------------------------------------  //

})();

//  ---------------------------------------------------------------------------------------------------------------  //

