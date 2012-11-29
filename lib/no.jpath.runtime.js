var no = require('./index.js');

var Benchtable = require('benchtable');

//  ---------------------------------------------------------------------------------------------------------------  //


function JNode(data) {
    this.data = data;
};

JNode.empty = new JNodeset();

/*
JNode.root = function(data) {
    return new JNode(data);
};
*/

JNode.prototype.isEmpty = function() {
    return false;
};

JNode.prototype.nametest = function(name, result) {
    var data = this.data;
    if (!data) {
        return JNode.empty;
    }

    var r = data[name];
    if (r === undefined) {
        return JNode.empty;
    }

    if ( Array.isArray(data) ) {
        result || (( result = new JNodeset() ));
        for (var i = 0; i < data.length; i++) {
            ( new JNode( data[i] ) ).nametest(name, result);
        }
        return result;
    }

    var node = new JNode(r);
    if (result) {
        result.push(node);
    } else {
        return node;
    }
};

JNode.prototype.startest = function(result) {
    result || (( result = new JNodeset() ));

    var data = this.data;
    if ( Array.isArray(data) ) {
        var root = this.root;
        for (var i = 0; i < data.length; i++) {
            result.push( new JNode( data[i], root ) );
        }
    } else {
        for (var key in data) {
            this.nametest(key, result)
        }
    }

    return result;
};

JNode.prototype.predicate = function(predicate) {
    return ( predicate(this) ) ? this : JNode.empty;
};

JNode.prototype.index = function(index) {
    var data = this.data;
    if ( Array.isArray(data) ) {
        var r = data[index];
        if (r !== undefined) {
            var node = new JNode(r);
            return node.toNodeset();
        }
        return JNode.empty;
    }

    return (index === 0) ? this : JNode.empty;
};

JNode.prototype.toArray = function() {
    return [ this.data ];
};

JNode.prototype.scalar = function() {
    var data = this.data;
    return (typeof data === 'object') ? '' : data;
};

JNode.prototype.boolean = function() {
    return !!this.data;
};

//  ---------------------------------------------------------------------------------------------------------------  //

function JNodeset() {
    this.nodes = [];
};

/*
JNodeset.prototype.addTo = function(nodeset) {
    //  nodeset.nodes = nodeset.nodes.concat( this.nodes );
    var nodes = nodeset.nodes;
    nodes.push.apply(nodes, this.nodes);
};
*/

JNodeset.prototype.isEmpty = function() {
    return !this.nodes.length;
};

JNodeset.prototype.push = function(node) {
    this.nodes.push(node);

    return this;
};

JNodeset.prototype.nametest = function(name, result) {
    var nodes = this.nodes;
    result || (( result = new JNodeset() ));
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].nametest(name, result);
    }
    return result;
};

JNodeset.prototype.startest = function(result) {
    var nodes = this.nodes;
    result || (( result = new JNodeset() ));
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].startest(result);
    }
    return result;
};

JNodeset.prototype.predicate = function(predicate, result) {
    var nodes = this.nodes;
    result || (( result = new JNodeset() ));
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if ( predicate(node) ) {
            result.push(node);
        }
    }
    return result;
};

JNodeset.prototype.index = function(index) {
    var node = this.nodes[index];

    if (node !== undefined) {
        return ( new JNodeset() ).push(node);
    }

    return JNode.empty;
};

JNodeset.prototype.toArray = function() {
    var r = [];
    var nodes = this.nodes;
    for (var i = 0; i < nodes.length; i++) {
        r.push( nodes[i].data );
    }
    return r;
};

JNodeset.prototype.scalar = function() {
    var nodes = this.nodes;
    if (!nodes.length) {
        return '';
    }

    return nodes[0].scalar();
};

JNodeset.prototype.boolean = function() {
    var nodes = this.nodes;
    if (!nodes.length) {
        return false;
    }

    return nodes[0].boolean();
};

//  ---------------------------------------------------------------------------------------------------------------  //

var data = {
    foo: {
        bar: 42
    },
    boo: {
        bar: 24
    },
    qoo: {
        bar: [ 66, 33 ]
    }
};

function pred(node) {
    return ( node.nametest('bar').scalar() > 30 );
}

function jpath(data) {
    var r = JNode(data);
    //  Чекаем guard'ы.
    if (!( guard1(r) && guard2(r) )) {
        return JNode.empty;
    }



}

function start(data) {
    var r = new JNode(data);
    r = r.startest();
    //  r = r.nametest('qoo');
    if ( !r.isEmpty() ) {
        //  r = r.startest();
        //  r = r.nametest('bar');
        r = r.predicate(pred);
    }
    /*
    */
    //  return r.toArray();
    return r;
}

console.log( start(data).toArray() );

/*
var suite = new Benchtable();

//  ---------------------------------------------------------------------------------------------------------------  //

suite.addFunction('jnode', start);

suite.addFunction('no.jpath', function(data) {
    //  return no.jpath('.*.*', data);
    return no.jpath('.qoo', data);
});

suite.addInput('data', [ data ]);

//  ---------------------------------------------------------------------------------------------------------------  //

suite.on('complete', function() {
    console.log( this.table.toString() );
});

suite.run({ async: false });
*/


/*
JNode.prototype.predicate = function(pred) {

};

JNode.prototype.index = function(index) {

};

JNode.prototype.guard = function(guard) {

};
*/
