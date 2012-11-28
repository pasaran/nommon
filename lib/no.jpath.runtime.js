var no = require('./index.js');

var Benchtable = require('benchtable');

//  ---------------------------------------------------------------------------------------------------------------  //

var jempty = new JNodeset();

function JNode(data) {
    this.data = data;
};

JNode.root = function(data) {
    return new JNode(data);
};

JNode.prototype.isEmpty = function() {
    return false;
};

JNode.prototype.nametest = function(name, result) {
    var data = this.data;
    if (!data) {
        return jempty;
    }

    var r = data[name];
    if (r === undefined) {
        return jempty;
    }

    if ( Array.isArray(data) ) {
        result || (( result = new JNodeset() ));
        for (var i = 0; i < data.length; i++) {
            ( new JNode( data[i] ) ).nametest(name, result);
        }
        return result;
    }

    return new JNode(r);
};

JNode.prototype.startest = function(result) {
    result || (( result = new JNodeset() ));

    var data = this.data;
    for (var key in data) {
        this.nametest(key, result)
    }

    return result;
};

/*
JNode.prototype.addTo = function(nodeset) {
    nodeset.nodes.push(this);
};
*/

JNode.prototype.toArray = function() {
    return [ this.data ];
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

JNodeset.prototype.toArray = function() {
    var r = [];
    var nodes = this.nodes;
    for (var i = 0; i < nodes.length; i++) {
        r.push( nodes[i].data );
    }
    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

var data = {
    foo: {
        bar: 42
    },
    boo: {
        bar: 24
    }
};

function start(data) {
    var r = JNode.root(data);
    //  r = r.startest();
    r = r.nametest('foo');
    /*
    if ( !r.isEmpty() ) {
        //  r = r.startest();
        r = r.nametest('bar');
    }
    */
    //  return r.toArray();
    return r;
}

//  console.log( start(data).toArray() );

var suite = new Benchtable();

//  ---------------------------------------------------------------------------------------------------------------  //

suite.addFunction('jnode', start);

suite.addFunction('no.jpath', function(data) {
    //  return no.jpath('.*.*', data);
    return no.jpath('.foo', data);
});

suite.addInput('data', [ data ]);

//  ---------------------------------------------------------------------------------------------------------------  //

suite.on('complete', function() {
    console.log( this.table.toString() );
});

suite.run({ async: false });
/*
*/


/*
JNode.prototype.predicate = function(pred) {

};

JNode.prototype.index = function(index) {

};

JNode.prototype.guard = function(guard) {

};
*/
