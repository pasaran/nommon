var no = require('../lib/index.js');

var Benchtable = require('benchtable');

var suite = new Benchtable();

var data = {
    foo: {
        bar: 42
    },
    boo: [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven' ]
};

var jpaths = [
    '.foo',
    '.bar',
    '.foo.bar',
    '.foo.boo',
    '.foo[ .bar ]',
    '.foo[ .qoo ]',
    '.foo[ .bar == 42 ]',
    '.foo[ .bar == 24 ]',
    '.foo[ .bar == 24 || .bar == 42 ]',
    '.boo[4]',
    '.boo[10]'
];

jpaths.forEach(function(jpath) {
    suite.addFunction(jpath, function(data) {
        return no.jpath(jpath, data);
    });
});

suite.addInput('data', [ data ]);

suite.on('complete', function() {
    console.log( this.table.toString() );
});

suite.run({ async: false });

