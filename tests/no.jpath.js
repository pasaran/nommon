var no = require('../lib/no.jpath.js');

var expect = require('expect.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var data = {
    index: 2,
    count: 42,
    id: 'two',

    item: [
        { id: 'one', count: 24 },
        { id: 'two', count: 13, selected: true },
        { id: 'three', count: 17 },
        { id: 'four', count: 59, selected: true },
        { id: 'five', count: 42 }
    ],

    ids1: [ 'two', 'three', 'five' ],
    ids2: [ 'six', 'seven', 'eight' ],
    ids3: [ 'one', 'six', 'ten' ],

    a: {
        b: 42,
        c: 24,
        d: 66
    },
    p: {
        q: 24,
        r: 37,
        t: 66
    },

    x: 4,
    y: 7,
    z: 3,
    t: 10
};

//  ---------------------------------------------------------------------------------------------------------------  //

describe('simple jpath', function() {

    it('.id', function() {
        expect( no.jpath('.id', data) ).to.be('two');
    });

    it('.a.b', function() {
        expect( no.jpath('.a.b', data) ).to.be(42);
    });

    it('.item.id', function() {
        expect( no.jpath('.item.id', data) ).to.eql( [ 'one', 'two', 'three', 'four', 'five' ] );
    });

    it('.a.*', function() {
        expect( no.jpath('.a.*', data) ).to.eql( [ 42, 24, 66 ] );
    });

    it('.ids1', function() {
        expect( no.jpath('.ids1', data) ).to.eql( [ 'two', 'three', 'five' ] );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jpath with predicate', function() {

    it('.item[ .selected ].id', function() {
        expect( no.jpath('.item[ .selected ].id', data) ).to.eql( [ 'two', 'four' ] );
    });

    it('.item[ .count > 20 ].id', function() {
        expect( no.jpath('.item[ .count > 20 ].id', data) ).to.eql( [ 'one', 'four', 'five' ] );
    });

});

describe('root or self with predicate', function() {

    it('.[ .count > 0 ].count', function() {
        expect( no.jpath('.[ .count > 0 ].count', data) ).to.be(42);
    });

    it('.[ .count < 0 ].count', function() {
        expect( no.jpath('.[ .count < 0 ].count', data) ).to.be(undefined);
    });

    it('/[ .count > 0 ].count', function() {
        expect( no.jpath('/[ .count > 0 ].count', data) ).to.be(42);
    });

    it('/[ .count < 0 ].count', function() {
        expect( no.jpath('/[ .count < 0 ].count', data) ).to.be(undefined);
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jpath with index', function() {

    it('.item[2].id', function() {
        expect( no.jpath('.item[2].id', data) ).to.eql( 'three' );
    });

    it('.item[ /.index ].id', function() {
        expect( no.jpath('.item[ /.index ].id', data) ).to.eql( 'three' );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('variables', function() {

    it('config.foo.bar', function() {
        expect( no.jpath('config.foo.bar', {}, { config: { foo: { bar: 42 } } }) ).to.be(42);
    });

    it('.item[ index ].id', function() {
        expect( no.jpath('.item[ index ].id', data, { index: 2 }) ).to.eql( 'three' );
    });

    it('index', function() {
        expect( no.jpath('index', {}, { index: 42 }) ).to.be(42);
    });

    it('config', function() {
        expect( no.jpath('config', {}, { config: { foo: 42 } }) ).to.eql( { foo: 42 } );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jpath with "guard"', function() {
    //  There are no guards anymore, but you can use "guard"-expression with &&.

    it('( /.id == "two" ) && .item[ .selected ].id', function() {
        expect( no.jpath('( /.id == "two" ) && .item[ .selected ].id', data) ).to.eql( [ 'two', 'four' ] );
    });

    it('( /.id != "two" ) && .item.id', function() {
        expect( no.jpath('( /.id != "two" ) && .item.id', data) ).to.eql(false);
    });

    it('( /.id == "two" ) && .item[ .selected ].id', function() {
        expect( no.jpath('( /.id == "two" ) && .item[ .selected ].id', data) ).to.eql( [ 'two', 'four' ] );
    });

    it('( /.id != "two" ) && .item[ .selected ].id', function() {
        expect( no.jpath('( /.id != "two" ) && .item[ .selected ].id', data) ).to.eql(false);
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('compare nodeset to nodeset', function() {

    it('.item.id ~~ .ids1', function() {
        expect( no.jpath('.item.id ~~ .ids1', data) ).be.ok;
    });

    it('.item.id !~ .ids1', function() {
        expect( no.jpath('.item.id !~ .ids1', data) ).not.be.ok;
    });

    it('.item.id ~~ .ids2', function() {
        expect( no.jpath('.item.id ~~ .ids2', data) ).not.be.ok;
    });

    it('.item.id != .ids2', function() {
        expect( no.jpath('.item.id !~ .ids2', data) ).be.ok;
    });

    it('.item.id ~~ .ids3', function() {
        expect( no.jpath('.item.id ~~ .ids3', data) ).be.ok;
    });

    it('.item.id !~ .ids3', function() {
        expect( no.jpath('.item.id !~ .ids3', data) ).not.be.ok;
    });

    it('.item[ .id ~~ /.ids1 ].id', function() {
        expect( no.jpath('.item[ .id ~~ /.ids1 ].id', data) ).to.eql( [ 'two', 'three', 'five' ] );
    });

    it('.item[ .id ~~ /.ids2 ].id', function() {
        expect( no.jpath('.item[ .id ~~ /.ids2 ].id', data) ).to.be.empty();
    });

    it('.item[ .id ~~ /.ids3 ].id', function() {
        expect( no.jpath('.item[ .id ~~ /.ids3 ].id', data) ).to.eql( [ 'one' ] );
    });

    it('.count ~~ .a.b', function() {
        expect( no.jpath('.count ~~ .a.b', data) ).be.ok;
    });

    it('.count ~~ .p.q', function() {
        expect( no.jpath('.count ~~ .p.q', data) ).not.be.ok;
    });

    it('.a.*[ . ~~ /.p.* ]', function() {
        expect( no.jpath('.a.*[ . ~~ /.p.* ]', data) ).to.eql( [ 24, 66 ] );
    });

    it('.item[ .count ~~ /.a.* ].id', function() {
        expect( no.jpath('.item[ .count ~~ /.a.* ].id', data) ).to.eql( [ 'one', 'five' ] );
    });

    it('.item[ .id ~~ /.id ].id', function() {
        expect( no.jpath('.item[ .id ~~ /.id ].id', data) ).to.eql( [ 'two' ] );
    });

    it('.ids1 ~~ .ids2', function() {
        expect( no.jpath('.ids1 ~~ .ids2', data) ).not.be.ok;
    });

    it('.ids2 ~~ .ids3', function() {
        expect( no.jpath('.ids2 ~~ .ids3', data) ).be.ok;
    });

    it('.ids1 ~~ "two"', function() {
        expect( no.jpath('.ids1 ~~ "two"', data) ).be.ok;
    });

    it('.ids1 !~ "two"', function() {
        expect( no.jpath('.ids1 !~ "two"', data) ).not.be.ok;
    });

    it('.ids1 ~~ "one"', function() {
        expect( no.jpath('.ids1 ~~ "one"', data) ).not.be.ok;
    });

    it('.ids1 !~ "one"', function() {
        expect( no.jpath('.ids1 !~ "one"', data) ).be.ok;
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('compare nodeset to scalar', function() {

    it('.item.count ~~ 42', function() {
        expect( no.jpath('.item.count ~~ 42', data) ).be.ok;
    });

    it('.item.count !~ 42', function() {
        expect( no.jpath('.item.count !~ 42', data) ).not.be.ok;
    });

    it('.item.count ~~ 84', function() {
        expect( no.jpath('.item.count ~~ 84', data) ).not.be.ok;
    });

    it('.item.count !~ 84', function() {
        expect( no.jpath('.item.count !~ 84', data) ).be.ok;
    });

    it('.item.id ~~ "two"', function() {
        expect( no.jpath('.item.id ~~ "two"', data) ).be.ok;
    });

    it('.item.id !~ "two"', function() {
        expect( no.jpath('.item.id !~ "two"', data) ).not.be.ok;
    });

    it('.item[ .id ~~ "two" ]', function() {
        expect( no.jpath('.item[ .id ~~ "two" ].id', data) ).to.eql( [ 'two' ] );
    });

    it('.item[ .id !~ "two" ]', function() {
        expect( no.jpath('.item[ .id !~ "two" ].id', data) ).to.eql( [ 'one', 'three', 'four', 'five' ] );
    });

    it('.item[ .id !~ "" ]', function() {
        expect( no.jpath('.item[ .id !~ "" ].id', data) ).to.eql( [ 'one', 'two', 'three', 'four', 'five' ] );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('arithmetic operations', function() {

    it('+.count', function() {
        expect( no.jpath('+.count', data) ).to.be(42);
    });

    it('-.count', function() {
        expect( no.jpath('-.count', data) ).to.be(-42);
    });

    it('.count + 5', function() {
        expect( no.jpath('.count + 5', data) ).to.be(47);
    });

    it('.count - 5', function() {
        expect( no.jpath('.count - 5', data) ).to.be(37);
    });

    it('.a.b + .a.c', function() {
        expect( no.jpath('.a.b + .a.c', data) ).to.be(66);
    });

    it('.a.b * .a.c', function() {
        expect( no.jpath('.a.b * .a.c', data) ).to.be(1008);
    });

    it('.a.b / .a.c', function() {
        expect( no.jpath('.a.b / .a.c', data) ).to.be(1.75);
    });

    it('.count % 17', function() {
        expect( no.jpath('.count % 17', data) ).to.be(8);
    });

    it('( .x + .y ) * ( .z + .t )', function() {
        expect( no.jpath('( .x + .y ) * ( .z + .t )', data) ).to.be(143);
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('empty strings', function() {

    var data = {
        hello: 'Hello',
        empty: ''
    };

    it('""', function() {
        expect( no.jpath('""') ).to.eql('');
    });

    it('.hello != ""', function() {
        expect( no.jpath('.hello != ""', data) ).be.ok;
    });

    it('.hello == ""', function() {
        expect( no.jpath('.hello == ""', data) ).not.be.ok;
    });

    it('.empty != ""', function() {
        expect( no.jpath('.empty != ""', data) ).not.be.ok;
    });

    it('.empty == ""', function() {
        expect( no.jpath('.empty == ""', data) ).be.ok;
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('comparisons', function() {

    it('.count > 20', function() {
        expect( no.jpath('.count > 20', data) ).be.ok;
    });

    it('.count < 20', function() {
        expect( no.jpath('.count < 20', data) ).not.be.ok;
    });

    it('.count >= 42', function() {
        expect( no.jpath('.count >= 42', data) ).be.ok;
    });

    it('.count <= 42', function() {
        expect( no.jpath('.count <= 42', data) ).be.ok;
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('priorities of operations', function() {

    it('.x + .y * .z', function() {
        expect( no.jpath('.x + .y * .z', data) ).to.be(25);
    });

    it('9 - 2 - 3', function() {
        expect( no.jpath('9 - 2 - 3', data) ).to.be(4);
    });

    it('20 / 4 / 5', function() {
        expect( no.jpath('20 / 4 / 5', data) ).to.be(1);
    });

    it('.x * .y + .z', function() {
        expect( no.jpath('.x * .y + .z', data) ).to.be(31);
    });

    it('.x + 2 * .y < .z * 3 + .t', function() {
        expect( no.jpath('.x + 2 * .y < .z * 3 + .t', data) ).be.ok;
    });

    it('.x == 5 || .y == 7 && .z == 4', function() {
        expect( no.jpath('.x == 5 || .y == 7 && .z == 4', data) ).not.be.ok;
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('falsy jpaths', function() {

    var data = {
        foo: {
            a: true,
            b: 'hello',
            c: 42,
            d: '',
            e: 0,
            f: null,
            g: false,
            h: undefined
        }
    };

    it('true', function() {
        expect( no.jpath('.foo[ .a ].c', data) ).to.be(42);
    });

    it('non-empty string', function() {
        expect( no.jpath('.foo[ .b ].c', data) ).to.be(42);
    });

    it('non-zero number', function() {
        expect( no.jpath('.foo[ .c ].c', data) ).to.be(42);
    });

    it('empty string', function() {
        expect( no.jpath('.foo[ .d ].c', data) ).to.be(undefined);
    });

    it('zero', function() {
        expect( no.jpath('.foo[ .e ].c', data) ).to.be(undefined);
    });

    it('null', function() {
        expect( no.jpath('.foo[ .f ].c', data) ).to.be(undefined);
    });

    it('false', function() {
        expect( no.jpath('.foo[ .g ].c', data) ).to.be(undefined);
    });

    it('undefined', function() {
        expect( no.jpath('.foo[ .h ].c', data) ).to.be(undefined);
    });

    it('non-existence key', function() {
        expect( no.jpath('.foo[ .z ].c', data) ).to.be(undefined);
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('short-circuit evaluation', function() {

    var data = {
        a: 0,
        b: false,
        c: '',
        //  d: undefined
        e: 24,
        f: true,
        g: 'foo'
    };

    it('.a || 42', function() {
        expect( no.jpath('.a || 42', data) ).to.be(42);
    });

    it('.b || 42', function() {
        expect( no.jpath('.b || 42', data) ).to.be(42);
    });

    it('.c || 42', function() {
        expect( no.jpath('.c || 42', data) ).to.be(42);
    });

    it('.d || 42', function() {
        expect( no.jpath('.d || 42', data) ).to.be(42);
    });

    it('.a || .b || .c || .d || 42', function() {
        expect( no.jpath('.a || .b || .c || .d || 42', data) ).to.be(42);
    });

    it('.e || 42', function() {
        expect( no.jpath('.e || 42', data) ).to.be(24);
    });

    it('.f || 42', function() {
        expect( no.jpath('.f || 42', data) ).to.be(true);
    });

    it('.g || 42', function() {
        expect( no.jpath('.g || 42', data) ).to.be('foo');
    });

    it('.a == 0 && .g == "foo"', function() {
        expect( no.jpath('.a == 0 && .g == "foo"', data) ).to.be(true);
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('string interpolation', function() {

    var data = {
        foo: {
            bar: 'hello'
        },
        a: 'he',
        b: 'll',
        c: 'o'
    };

    it('"{ .a }{ .b }"', function() {
        expect( no.jpath('"{ .a }{ .b }{ .c }"', data) ).to.be('hello');
    });

    it('.foo.bar[ . == "hello" ]', function() {
        expect( no.jpath('.foo.bar[ . == "hello" ]', data) ).to.be('hello');
    });

    it('.foo.bar[ . == "{ /.a }llo" ]', function() {
        expect( no.jpath('.foo.bar[ . == "{ /.a }llo" ]', data) ).to.be('hello');
    });

    it('.foo.bar[ . == "{ /.a }ll{ /.c }" ]', function() {
        expect( no.jpath('.foo.bar[ . == "{ /.a }ll{ /.c }" ]', data) ).to.be('hello');
    });

    it('.foo.bar[ . == "{ /.a }{ /.b }{ /.c }" ]', function() {
        expect( no.jpath('.foo.bar[ . == "{ /.a }{ /.b }{ /.c }" ]', data) ).to.be('hello');
    });

    it('"{ .foo }"', function() {
        expect( no.jpath('"{ .foo }"', data) ).to.be('');
    });

    it('"{ .bar }"', function() {
        expect( no.jpath('"{ .bar }"', data) ).to.be('');
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('funcs', function() {

    var data = {
        text: 'Привет'
    };

    no.jpath.defunc( 'encode', {
        scheme: 'string',
        body: function(s) {
            return encodeURIComponent(s);
        }
    } );

    it('encode', function() {
        expect(
            no.jpath('"http://yandex.ru/yandsearch?text={ encode(.text) }"', data)
        ).to.eql('http://yandex.ru/yandsearch?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82')
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jresult', function() {

    var data = {
        item: [
            { id: 'one', count: 24 },
            { id: 'two', count: 13, selected: true },
            { id: 'three', count: 17 },
            { id: 'four', count: 59, selected: true },
            { id: 'five', count: 42 }
        ],

        foo: {
            bar: {
                first: 1,
                second: 2,
                third: 3
            }
        }
    };

    it('jresult #1', function() {
        expect( no.jpath({
            selected: '.item[ .selected ]'
        }, data) ).to.eql({
            selected: [
                { id: 'two', count: 13, selected: true },
                { id: 'four', count: 59, selected: true }
            ]
        });
    });

    it('jresult #2', function() {
        expect( no.jpath({
            foo: '.foo.bar',
            ids: '.item.id'
        }, data) ).to.eql({
            foo: {
                first: 1,
                second: 2,
                third: 3
            },
            ids: [ 'one', 'two', 'three', 'four', 'five' ]
        });
    });

});

describe('escape symbols', function() {

    var data = {
        foo: '"hello"',
        bar: '\\hello\\'
    };

    it('foo-{{ bar }}', function() {
        expect( no.jpath('"foo-{{ bar }}"') ).to.be('foo-{ bar }');
    });

    it('foo-{{ bar }}', function() {
        expect( no.jpath.string('foo-{{ bar }}')() ).to.be('foo-{ bar }');
    });

    it('.foo[ . == "\\\"hello\\\"" ]', function() {
        expect( no.jpath('.foo[ . == "\\\"hello\\\"" ]', data) ).to.be('"hello"');
    });

    it('.foo[ . == "\\"hello\\"" ]', function() {
        expect( no.jpath('.foo[ . == "\\"hello\\"" ]', data) ).to.be('"hello"');
    });

    it('.foo[ . == "\\hello\\" ]', function() {
        expect( no.jpath('.bar[ . == "\\hello\\\\" ]', data) ).to.be('\\hello\\');
    });

});

//  Обсуждение вложенных массивов.
//  https://github.com/pasaran/nommon/issues/5
//
describe('nested arrays', function() {

    var data1 = {
        foo: [
            {
                bar: [ 42, 24 ]
            },
            {
                bar: 66
            }
        ]
    };

    it('.foo.bar', function() {
        expect( no.jpath('.foo.bar', data1) ).to.eql( [ [ 42, 24 ], 66 ] );
    });

    it('.foo.*', function() {
        expect( no.jpath('.foo.bar', data1) ).to.eql( [ [ 42, 24 ], 66 ] );
    });

    var data2 = {
        foo: [
            {
                bar: [
                    {
                        boo: [ 42, 24 ]
                    },
                    {
                        boo: 66
                    }
                ]
            },
            {
                bar: [
                    {
                        boo: 73
                    },
                    {
                        boo: [ 29, 44 ]
                    }
                ]
            }
        ]
    };

    it('.foo.bar.boo', function() {
        expect( no.jpath('.foo.bar.boo', data2) ).to.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    });

    it('.foo.*.boo', function() {
        expect( no.jpath('.foo.bar.boo', data2) ).to.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    });

    it('.foo.bar.*', function() {
        expect( no.jpath('.foo.bar.boo', data2) ).to.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    });

    it('.foo.*.*', function() {
        expect( no.jpath('.foo.bar.boo', data2) ).to.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    });

    it('.*.*.*', function() {
        expect( no.jpath('.foo.bar.boo', data2) ).to.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jpath methods', function() {
    var scheme = no.scheme( {
        foo: {
            bar: 'string'
        }
    } );

    var jpath = no.jpath.expr( '.foo.bar.substr(7,6)', scheme );

    var data = {
        foo: {
            bar: 'Hello, World!'
        }
    };

    it('.foo.bar.substr(7,6)', function() {
        expect( jpath( data ) ).to.eql( 'World!' );
    } );

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'jref', function() {
    var data = {
        foo: 4,
        bar: 5
    };

    no.jpath.add( 'foo', '.foo' );
    no.jpath.add( 'bar', '.bar' );

    var jpath = no.jpath.expr( '&foo + &bar' );

    it( '&foo + &bar', function() {
        expect( jpath( data ) ).to.eql( 9 );
    } );
} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jresults', function() {

    it('simple object', function() {
        expect( no.jpath({
            id: '.id',
            count: '.count'
        }, data) ).to.eql({
            count: 42,
            id: 'two'
        });
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

