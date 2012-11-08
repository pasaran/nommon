var no;
if (typeof window === 'undefined') {
    no = require('./no.js');
} else {
    no = no || {};
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser = function(rules, tokens) {
    this._rules = rules;
    this._tokens = tokens || {};
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.start = function(input, id) {
    this.input = input;

    var ast = this.parse(id);

    if (this.input) {
        this.error('End of string expected');
    }

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.parse = function(id, params) {
    var rule = this._rules[id];

    return rule.call(this, params);
};

no.Parser.prototype.test = function(id) {
    var token = this._tokens[id];

    if (token) {
        var r = token.exec(this.input);
        return r && r[0];
    }

    if ( this.la(id.length) === id ) {
        return id;
    }
};

no.Parser.prototype.match = function(id) {
    var r = this.test(id);

    if (!r) {
        this.error('Token ' + id + 'expected');
    }

    this.move(r.length);

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.la = function(n) {
    return this.input.substr(0, n || 1);
};

no.Parser.prototype.move = function(n) {
    this.input = this.input.substr(n || 1);
};

no.Parser.prototype.skip = function() {
    var r = /^\s+/.exec(this.input);
    if (r) {
        this.move( r[0].length );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Parser.prototype.error = function(msg) {
    throw Error('ERROR: ' + msg + ' at : ' + this.input);
};

//  ---------------------------------------------------------------------------------------------------------------  //

