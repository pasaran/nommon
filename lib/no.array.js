var no = require('no.base');

//  ---------------------------------------------------------------------------------------------------------------  //

no.array = function(value) {
    if (value === undefined) {
        return [];
    }

    return (value instanceof Array) ? value : [ value ];
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.array.map = function(array, callback) {
    var r = [];

    for (var i = 0, l = array.length; i < l; i++) {
        var item = callback( array[i], i );
        if (item !== undefined) {
            r.push(item);
        }
    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

