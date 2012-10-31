//  ---------------------------------------------------------------------------------------------------------------  //
//  no
//  ---------------------------------------------------------------------------------------------------------------  //

var no = {};

if (typeof window === 'undefined') {
    global.no = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.inherit = function(ctor, base, mixin) {
    var F = function() {};
    F.prototype = base.prototype;
    var proto = ctor.prototype = new F();
    ctor.prototype.constructor = ctor;

    if (mixin) {
        no.extend(proto, mixin);
    }

    return ctor;
};

//  ---------------------------------------------------------------------------------------------------------------  //

/**
    @param {!Object} dest
    @param {...!Object} srcs
    @return {!Object}
*/
no.extend = function(dest) {
    for (var i = 1, l = arguments.length; i < l; i++) {
        var src = arguments[i];
        for (var key in src) {
            dest[key] = src[key];
        }
    }

    return dest;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.nop = function() {};

no.true = function() { return true; }
no.false = function() { return false; }

//  ---------------------------------------------------------------------------------------------------------------  //

no.log = function(msg) {
    return function() {
        var args = [].slice.call(arguments);
        args.unshift(msg);
        console.log.apply(null, args);
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

//  ---------------------------------------------------------------------------------------------------------------  //

