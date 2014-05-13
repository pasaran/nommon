//  ---------------------------------------------------------------------------------------------------------------  //

/**
    @constructor
    @param {Object} data
*/
function JNode(data) {
    this.data = data;
}

//  ---------------------------------------------------------------------------------------------------------------  //

JNode.prototype.empty = new JNodeset();

/**
    @return {boolean}
*/
JNode.prototype.isEmpty = function() {
    return false;
};

/**
    @param {string} name
    @param {JNodeset=} result
    @return {(JNode|JNodeset)}
*/
JNode.prototype.nametest = function(name, result) {
    var data = this.data;
    if (!data) {
        return this.empty;
    }

    if ( Array.isArray(data) ) {
        result || (( result = new JNodeset() ));
        for (var i = 0; i < data.length; i++) {
            ( new JNode( data[i] ) ).nametest(name, result);
        }
        return result;
    }

    var r = data[name];
    if (r === undefined) {
        return this.empty;
    }

    var node = new JNode(r);
    if (result) {
        return result.push(node);
    }

    return node;
};

/**
    @param {JNodeset=} result
    @return {JNodeset}
*/
JNode.prototype.startest = function(result) {
    result || (( result = new JNodeset() ));

    var data = this.data;
    if ( Array.isArray(data) ) {
        for (var i = 0; i < data.length; i++) {
            ( new JNode( data[i] ) ).startest(result);
        }
    } else {
        for (var key in data) {
            this.nametest(key, result);
        }
    }

    return result;
};

/**
    @param {function(JNode, JNode): boolean} filter
    @param {JNode} root
    @return {(JNode|JNodeset)}
*/
//  FIXME: Добавить тут четвертый параметр result?
JNode.prototype.pred = function(filter, root, vars, funcs) {
    var data = this.data;

    if ( Array.isArray(data) ) {
        var result = new JNodeset();
        for (var i = 0; i < data.length; i++) {
            var node = new JNode( data[i] );
            if ( filter(node, root, vars, funcs) ) {
                result.push(node);
            }
        }
        return result;
    }

    return ( filter(this, root, vars, funcs) ) ? this : this.empty;
};

/**
    @param {number} index
    @return {JNodeset}
*/
JNode.prototype.index = function(index, root, vars, funcs) {
    var data = this.data;

    if ( Array.isArray(data) ) {
        var r = data[ index(this, root, vars, funcs) ];
        return (r !== undefined) ? ( new JNode(r) ).toNodeset() : this.empty;
    }

    return (index === 0) ? this : this.empty;
};

/**
    @return {Array}
*/
JNode.prototype.toArray = function() {
    return [ this.data ];
};

/**
    @return {JNodeset}
*/
JNode.prototype.toNodeset = function() {
    return ( new JNodeset() ).push(this);
};

JNode.prototype.scalar = function() {
    var data = this.data;
    return (typeof data === 'object') ? '' : data;
};

/**
    @return {boolean}
*/
JNode.prototype.boolean = function() {
    var data = this.data;

    if ( Array.isArray(data) ) {
        //  FIXME: Нужно ли отдельно рассматривать случай, когда это массив
        //  из одного falsy элемента?
        return data.length > 0;
    }

    return !!data;
};

/**
    @param {JNodeset} nodeset
    @return {boolean}
*/
JNode.prototype.cmpN = function(nodeset) {
    var data = this.data;

    if ( Array.isArray(data) ) {
        for (var i = 0; i < data.length; i++) {
            if ( cmpN(new JNode( data[i] ), nodeset) ) {
                return true;
            }
        }
        return false;
    }

    return cmpN(this, nodeset);
};

function cmpN(node, nodeset) {
    if (nodeset instanceof JNode) {
        return cmpS( nodeset, node.scalar() );
    }

    var nodes = nodeset.nodes;
    var value = node.scalar();
    for (var i = 0; i < nodes.length; i++) {
        if ( value == nodes[i].scalar() ) {
            return true;
        }
    }
    return false;
}

JNode.prototype.cmpS = function(scalar) {
    return cmpS(this, scalar);
};

function cmpS(node, scalar) {
    var data = node.data;

    if ( Array.isArray(data) ) {
        for (var i = 0; i < data.length; i++) {
            if ( ( new JNode( data[i] ) ).scalar() == scalar ) {
                return true;
            }
        }
        return false;
    }

    return node.scalar() == scalar;
}

//  ---------------------------------------------------------------------------------------------------------------  //

/**
    @constructor
*/
function JNodeset() {
    this.nodes = [];
}

//  ---------------------------------------------------------------------------------------------------------------  //

JNodeset.prototype.empty = JNode.prototype.empty;

/**
    @return {boolean}
*/
JNodeset.prototype.isEmpty = function() {
    return !this.nodes.length;
};

/**
    @param {JNode} node
    @return {JNodeset}
*/
JNodeset.prototype.push = function(node) {
    this.nodes.push(node);

    return this;
};

/**
    @param {string} name
    @param {JNodeset=} result
    @return {JNodeset}
*/
JNodeset.prototype.nametest = function(name, result) {
    var nodes = this.nodes;
    result || (( result = new JNodeset() ));
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].nametest(name, result);
    }
    return result;
};

/**
    @param {JNodeset=} result
    @return {JNodeset}
*/
JNodeset.prototype.startest = function(result) {
    var nodes = this.nodes;
    result || (( result = new JNodeset() ));
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].startest(result);
    }
    return result;
};

/**
    @param {function(JNode, JNode): boolean} filter
    @param {JNode} root
    @param {JNodeset=} result
    @return {JNodeset}
*/
JNodeset.prototype.pred = function(filter, root, vars, funcs) {
    var nodes = this.nodes;
    //  FIXME: result || (( result = new JNodeset() ));
    var result = new JNodeset();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if ( filter(node, root, vars, funcs) ) {
            result.push(node);
        }
    }
    return result;
};

/**
    @param {number} index
    @return {JNodeset}
*/
JNodeset.prototype.index = function(index) {
    var node = this.nodes[index];

    if (node !== undefined) {
        return ( new JNodeset() ).push(node);
    }

    return this.empty;
};

/**
    @return {Array}
*/
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
    return (nodes.length) ? nodes[0].scalar() : '';
};

/**
    @return {boolean}
*/
JNodeset.prototype.boolean = function() {
    var nodes = this.nodes;
    return (nodes.length) ? nodes[0].boolean() : false;
};

/**
    @param {JNodeset} nodeset
    @return {boolean}
*/
JNodeset.prototype.cmpN = function(nodeset) {
    var nodes = this.nodes;
    for (var i = 0, l = nodes.length; i < l; i++) {
        if ( nodes[i].cmpN(nodeset) ) {
            return true;
        }
    }
    return false;
};

JNodeset.prototype.cmpS = function(scalar) {
    var nodes = this.nodes;
    for (var i = 0, l = nodes.length; i < l; i++) {
        if ( nodes[i].cmpS(scalar) ) {
            return true;
        }
    }
    return false;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.JNode = JNode;
no.JNodeset = JNodeset;

