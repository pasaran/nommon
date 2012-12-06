if (typeof window === 'undefined') {
    require('./no.jpath.runtime.js');
}

var data = {
    foo: [
        {
            id: 1,
            bar: 42
        },
        {
            id: 2,
            bar: 24
        },
        {
            id: 3,
            bar: 66
        }
    ],
    bar: {
        foo: 42
    },
    id: 2
};

//  ---------------------------------------------------------------------------------------------------------------  //

function test1(data) {
    var node = new JNode(data);
    var root = node;

    return (function(node, root) {
        node = node.nametest('foo');
        if (node.isEmpty()) { return node.empty; }
        node = node.filter(function(node, root) {
            return (function(node, root) {
                node = root.nametest('id');
                if (node.isEmpty()) { return node.empty; }
                return node;
            })(node, root).scalar() == (function(node, root) {
                node = node.nametest('id');
                if (node.isEmpty()) { return node.empty; }
                return node;
            })(node, root).scalar();
        }, root);
        if (node.isEmpty()) { return node.empty; }
        node = node.nametest('bar');
        if (node.isEmpty()) { return node.empty; }
        return node;
    })(node, root).scalar() + (function(node, root) {
        node = node.nametest('bar');
        if (node.isEmpty()) { return node.empty; }
        node = node.nametest('foo');
        if (node.isEmpty()) { return node.empty; }
        return node;
    })(node, root).scalar();
}

//  ---------------------------------------------------------------------------------------------------------------  //

function test2(data) {
    var node = new JNode(data);

    function t1(node, root) {
        node = root.nametest('id');
        if (node.isEmpty()) { return node.empty; }
        return node;
    }

    function t2(node, root) {
        node = node.nametest('id');
        if (node.isEmpty()) { return node.empty; }
        return node;
    }

    function t3(node, root) {
        //  return t1(node, root).compare(t2(node, root));
        return t1(node, root).scalar() == t2(node, root).scalar();
    }

    function t4(node, root) {
        node = node.nametest('foo');
        if (node.isEmpty()) { return node.empty; }
        node = node.filter(t3, root);
        if (node.isEmpty()) { return node.empty; }
        node = node.nametest('bar');
        if (node.isEmpty()) { return node.empty; }
        return node;
    }

    function t5(node, root) {
        node = node.nametest('bar');
        if (node.isEmpty()) { return node.empty; }
        node = node.nametest('foo');
        if (node.isEmpty()) { return node.empty; }
        return node;
    }

    function t6(node, root) {
        return t4(node, root).scalar() + t5(node, root).scalar();
    }

    return t6(node, node);
}

//  ---------------------------------------------------------------------------------------------------------------  //

function t1(node, root) {
    node = root.nametest('id');
    if (node.isEmpty()) { return node.empty; }
    return node;
}

function t2(node, root) {
    node = node.nametest('id');
    if (node.isEmpty()) { return node.empty; }
    return node;
}

function t3(node, root) {
    //  return t1(node, root).compare(t2(node, root));
    return t1(node, root).scalar() == t2(node, root).scalar();
}

function t4(node, root) {
    node = node.nametest('foo');
    if (node.isEmpty()) { return node.empty; }
    node = node.filter(t3, root);
    if (node.isEmpty()) { return node.empty; }
    node = node.nametest('bar');
    if (node.isEmpty()) { return node.empty; }
    return node;
}

function t5(node, root) {
    node = node.nametest('bar');
    if (node.isEmpty()) { return node.empty; }
    node = node.nametest('foo');
    if (node.isEmpty()) { return node.empty; }
    return node;
}

function t6(node, root) {
    return t4(node, root).scalar() + t5(node, root).scalar();
}

function test3(data) {
    var node = new JNode(data);

    return t6(node, node);
}

//  ---------------------------------------------------------------------------------------------------------------  //

var test4 = (function() {

    function t1(node, root) {
        node = root.nametest('id');
        if (node.isEmpty()) { return node.empty; }
        return node;
    }

    function t2(node, root) {
        node = node.nametest('id');
        if (node.isEmpty()) { return node.empty; }
        return node;
    }

    function t3(node, root) {
        //  return t1(node, root).compare(t2(node, root));
        return t1(node, root).scalar() == t2(node, root).scalar();
    }

    function t4(node, root) {
        node = node.nametest('foo');
        if (node.isEmpty()) { return node.empty; }
        node = node.filter(t3, root);
        if (node.isEmpty()) { return node.empty; }
        node = node.nametest('bar');
        if (node.isEmpty()) { return node.empty; }
        return node;
    }

    function t5(node, root) {
        node = node.nametest('bar');
        if (node.isEmpty()) { return node.empty; }
        node = node.nametest('foo');
        if (node.isEmpty()) { return node.empty; }
        return node;
    }

    function t6(node, root) {
        return t4(node, root).scalar() + t5(node, root).scalar();
    }

    return function(data) {
        var node = new JNode(data);

        return t6(node, node);
    };

})();

//  ---------------------------------------------------------------------------------------------------------------  //

var test5 = Function("\
\
    function t0(node, root) {\
        node = root.nametest('id');\
        if (node.isEmpty()) { return node.empty; }\
        return node;\
    }\
\
    function t1(node, root) {\
        node = node.nametest('id');\
        if (node.isEmpty()) { return node.empty; }\
        return node;\
    }\
\
    function t2(node, root) {\
        return t0(node, root).scalar() == t1(node, root).scalar();\
    }\
\
    function t3(node, root) {\
        node = node.nametest('foo');\
        if (node.isEmpty()) { return node.empty; }\
        node = node.filter(t2, root);\
        if (node.isEmpty()) { return node.empty; }\
        node = node.nametest('bar');\
        if (node.isEmpty()) { return node.empty; }\
        return node;\
    }\
\
    function t4(node, root) {\
        node = node.nametest('bar');\
        if (node.isEmpty()) { return node.empty; }\
        node = node.nametest('foo');\
        if (node.isEmpty()) { return node.empty; }\
        return node;\
    }\
\
    function t5(node, root) {\
        return t3(node, root).scalar() + t4(node, root).scalar();\
    }\
\
    return function(data) {\
        var node = new JNode(data);\
\
        return t5(node, node);\
    };\
\
")();

//  ---------------------------------------------------------------------------------------------------------------  //

var N = 100000;

var jpath = '.foo[ /.id == .id ].bar + .bar.foo';

console.time('test1');
for (var i = 0; i < N; i++) {
    var r = test1(data);
}
console.timeEnd('test1');
/*
*/

console.time('test2');
for (var i = 0; i < N; i++) {
    var r = test2(data);
}
console.timeEnd('test2');
/*
*/

console.time('test3');
for (var i = 0; i < N; i++) {
    var r = test3(data);
}
console.timeEnd('test3');
/*
*/

console.time('test4');
for (var i = 0; i < N; i++) {
    var r = test4(data);
}
console.timeEnd('test4');
/*
*/

console.time('test5');
for (var i = 0; i < N; i++) {
    var r = test5(data);
}
console.timeEnd('test5');
/*
*/

/*
var no = require('./index.js');

console.time('no.jpath');
for (var i = 0; i < N; i++) {
    var r = no.jpath(jpath, data);
}
console.timeEnd('no.jpath');
*/

