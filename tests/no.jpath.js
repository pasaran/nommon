var no = require('../lib');

var should = require('should');

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
        no.jpath('.id', data).should.be.eql('two');
    });

    it('.a.b', function() {
        no.jpath('.a.b', data).should.be.eql(42);
    });

    it('.item.id', function() {
        no.jpath('.item.id', data).should.be.eql( [ 'one', 'two', 'three', 'four', 'five' ] );
    });

    it('.a.*', function() {
        no.jpath('.a.*', data).should.be.eql( [ 42, 24, 66 ] );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jpath with predicate', function() {

    it('.item[ .selected ].id', function() {
        no.jpath('.item[ .selected ].id', data).should.be.eql( [ 'two', 'four' ] );
    });

    it('.item[ .count > 20 ].id', function() {
        no.jpath('.item[ .count > 20 ].id', data).should.be.eql( [ 'one', 'four', 'five' ] );
    });

});

describe('root or self with predicate', function() {

    it('.[ .count > 0 ].count', function() {
        no.jpath('.[ .count > 0 ].count', data).should.be.eql(42);
    });

    it('.[ .count < 0 ].count', function() {
        no.jpath('.[ .count < 0 ].count', data).should.be.eql( [] );
    });

    it('/[ .count > 0 ].count', function() {
        no.jpath('/[ .count > 0 ].count', data).should.be.eql(42);
    });

    it('/[ .count < 0 ].count', function() {
        no.jpath('/[ .count < 0 ].count', data).should.be.eql( [] );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jpath with index', function() {

    it('.item[2].id', function() {
        no.jpath('.item[2].id', data).should.be.eql( [ 'three' ] );
    });

    it('.item[ /.index ].id', function() {
        no.jpath('.item[ /.index ].id', data).should.be.eql( [ 'three' ] );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('variables', function() {

    it('config.foo.bar', function() {
        no.jpath('config.foo.bar', {}, { config: { foo: { bar: 42 } } }).should.be.eql(42);
    });

    it('.item[ index ].id', function() {
        no.jpath('.item[ index ].id', data, { index: 2 }).should.be.eql( [ 'three' ] );
    });

    it('index', function() {
        no.jpath('index', {}, { index: 42 }).should.be.eql(42);
    });

    it('config', function() {
        no.jpath('config', {}, { config: { foo: 42 } }).should.be.eql( { foo: 42 } );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jpath with guard', function() {

    it('.item[ .selected ][ /.id == "two" ].id', function() {
        no.jpath('.item[ .selected ][ /.id == "two" ].id', data).should.be.eql( [ 'two', 'four' ] );
    });

    it('.item[ /.id != "two" ].id', function() {
        no.jpath('.item[ .selected ][ /.id != "two" ].id', data).should.be.eql( [] );
    });

    it('.item[ /.id == "two" ][ .selected ].id', function() {
        no.jpath('.item[ /.id == "two" ][ .selected ].id', data).should.be.eql( [ 'two', 'four' ] );
    });

    it('.item[ /.id != "two" ][ .selected ].id', function() {
        no.jpath('.item[ /.id != "two" ][ .selected ].id', data).should.be.eql( [] );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('compare nodeset to nodeset', function() {

    it('.item.id == .ids1', function() {
        no.jpath('.item.id == .ids1', data).should.be.ok;
    });

    it('.item.id != .ids1', function() {
        no.jpath('.item.id != .ids1', data).should.not.be.ok;
    });

    it('.item.id == .ids2', function() {
        no.jpath('.item.id == .ids2', data).should.not.be.ok;
    });

    it('.item.id != .ids2', function() {
        no.jpath('.item.id != .ids2', data).should.be.ok;
    });

    it('.item.id == .ids3', function() {
        no.jpath('.item.id == .ids3', data).should.be.ok;
    });

    it('.item.id != .ids3', function() {
        no.jpath('.item.id != .ids3', data).should.not.be.ok;
    });

    it('.item[ .id == /.ids1 ]', function() {
        no.jpath('.item[ .id == /.ids1 ].id', data).should.be.eql( [ 'two', 'three', 'five' ] );
    });

    it('.item[ .id == /.ids2 ]', function() {
        no.jpath('.item[ .id == /.ids2 ].id', data).should.be.eql( [] );
    });

    it('.item[ .id == /.ids3 ]', function() {
        no.jpath('.item[ .id == /.ids3 ].id', data).should.be.eql( [ 'one' ] );
    });

    it('.count == .a.b', function() {
        no.jpath('.count == .a.b', data).should.be.ok;
    });

    it('.count == .p.q', function() {
        no.jpath('.count == .p.q', data).should.not.be.ok;
    });

    it('.a.*[ . == /.p.* ]', function() {
        no.jpath('.a.*[ . == /.p.* ]', data).should.be.eql( [ 24, 66 ] );
    });

    it('.item[ .count == /.a.* ].id', function() {
        no.jpath('.item[ .count == /.a.* ].id', data).should.be.eql( [ 'one', 'five' ] );
    });

    it('.item[ .id == /.id ].id', function() {
        no.jpath('.item[ .id == /.id ].id', data).should.be.eql( [ 'two' ] );
    });

    it('.ids1 == .ids2', function() {
        no.jpath('.ids1 == .ids2', data).should.not.be.ok;
    });

    it('.ids2 == .ids3', function() {
        no.jpath('.ids2 == .ids3', data).should.be.ok;
    });

    it('.ids1 == "two"', function() {
        no.jpath('.ids1 == "two"', data).should.be.ok;
    });

    it('.ids1 != "two"', function() {
        no.jpath('.ids1 != "two"', data).should.not.be.ok;
    });

    it('.ids1 == "one"', function() {
        no.jpath('.ids1 == "one"', data).should.not.be.ok;
    });

    it('.ids1 != "one"', function() {
        no.jpath('.ids1 != "one"', data).should.be.ok;
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('compare nodeset to scalar', function() {

    it('.item.count == 42', function() {
        no.jpath('.item.count == 42', data).should.be.ok;
    });

    it('.item.count != 42', function() {
        no.jpath('.item.count != 42', data).should.not.be.ok;
    });

    it('.item.count == 84', function() {
        no.jpath('.item.count == 84', data).should.not.be.ok;
    });

    it('.item.count != 84', function() {
        no.jpath('.item.count != 84', data).should.be.ok;
    });

    it('.item.id == "two"', function() {
        no.jpath('.item.id == "two"', data).should.be.ok;
    });

    it('.item.id != "two"', function() {
        no.jpath('.item.id != "two"', data).should.not.be.ok;
    });

    it('.item[ .id == "two" ]', function() {
        no.jpath('.item[ .id == "two" ].id', data).should.be.eql( [ 'two' ] );
    });

    it('.item[ .id != "two" ]', function() {
        no.jpath('.item[ .id != "two" ].id', data).should.be.eql( [ 'one', 'three', 'four', 'five' ] );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('arithmetic operations', function() {

    it('+.count', function() {
        no.jpath('+.count', data).should.be.equal(42);
    });

    it('-.count', function() {
        no.jpath('-.count', data).should.be.equal(-42);
    });

    it('.count + 5', function() {
        no.jpath('.count + 5', data).should.be.equal(47);
    });

    it('.count - 5', function() {
        no.jpath('.count - 5', data).should.be.equal(37);
    });

    it('.a.b + .a.c', function() {
        no.jpath('.a.b + .a.c', data).should.be.equal(66);
    });

    it('.a.b * .a.c', function() {
        no.jpath('.a.b * .a.c', data).should.be.equal(1008);
    });

    it('.a.b / .a.c', function() {
        no.jpath('.a.b / .a.c', data).should.be.equal(1.75);
    });

    it('.count % 17', function() {
        no.jpath('.count % 17', data).should.be.equal(8);
    });

    it('( .x + .y ) * ( .z + .t )', function() {
        no.jpath('( .x + .y ) * ( .z + .t )', data).should.be.eql(143);
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('comparisons', function() {

    it('.count > 20', function() {
        no.jpath('.count > 20', data).should.be.ok;
    });

    it('.count < 20', function() {
        no.jpath('.count < 20', data).should.not.be.ok;
    });

    it('.count >= 42', function() {
        no.jpath('.count >= 42', data).should.be.ok;
    });

    it('.count <= 42', function() {
        no.jpath('.count <= 42', data).should.be.ok;
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('priorities of operations', function() {

    it('.x + .y * .z', function() {
        no.jpath('.x + .y * .z', data).should.be.eql(25);
    });

    it('9 - 2 - 3', function() {
        no.jpath('9 - 2 - 3', data).should.be.eql(4);
    });

    it('20 / 4 / 5', function() {
        no.jpath('20 / 4 / 5', data).should.be.eql(1);
    });

    it('.x * .y + .z', function() {
        no.jpath('.x * .y + .z', data).should.be.eql(31);
    });

    it('.x + 2 * .y < .z * 3 + .t', function() {
        no.jpath('.x + 2 * .y < .z * 3 + .t', data).should.be.ok;
    });

    it('.x == 5 || .y == 7 && .z == 4', function() {
        no.jpath('.x == 5 || .y == 7 && .z == 4', data).should.not.be.ok;
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
        no.jpath('.foo[ .a ].c', data).should.be.eql(42);
    });

    it('non-empty string', function() {
        no.jpath('.foo[ .b ].c', data).should.be.eql(42);
    });

    it('non-zero number', function() {
        no.jpath('.foo[ .c ].c', data).should.be.eql(42);
    });

    it('empty string', function() {
        no.jpath('.foo[ .d ].c', data).should.be.eql( [] );
    });

    it('zero', function() {
        no.jpath('.foo[ .e ].c', data).should.be.eql( [] );
    });

    it('null', function() {
        no.jpath('.foo[ .f ].c', data).should.be.eql( [] );
    });

    it('false', function() {
        no.jpath('.foo[ .g ].c', data).should.be.eql( [] );
    });

    it('undefined', function() {
        no.jpath('.foo[ .h ].c', data).should.be.eql( [] );
    });

    it('non-existence key', function() {
        no.jpath('.foo[ .z ].c', data).should.be.eql( [] );
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
        no.jpath('"{ .a }{ .b }{ .c }"', data).should.be.eql('hello');
    });

    it('.foo.bar[ . == "hello" ]', function() {
        no.jpath('.foo.bar[ . == "hello" ]', data).should.be.eql('hello');
    });

    it('.foo.bar[ . == "{ /.a }llo" ]', function() {
        no.jpath('.foo.bar[ . == "{ /.a }llo" ]', data).should.be.eql('hello');
    });

    it('.foo.bar[ . == "{ /.a }ll{ /.c }" ]', function() {
        no.jpath('.foo.bar[ . == "{ /.a }ll{ /.c }" ]', data).should.be.eql('hello');
    });

    it('.foo.bar[ . == "{ /.a }{ /.b }{ /.c }" ]', function() {
        no.jpath('.foo.bar[ . == "{ /.a }{ /.b }{ /.c }" ]', data).should.be.eql('hello');
    });

    it('"{ .foo }"', function() {
        no.jpath('"{ .foo }"', data).should.be.eql('');
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
        no.jpath({
            selected: '.item[ .selected ]'
        }, data).should.be.eql({
            selected: [
                { id: 'two', count: 13, selected: true },
                { id: 'four', count: 59, selected: true }
            ]
        });
    });

    it('jresult #2', function() {
        no.jpath({
            foo: '.foo.bar',
            ids: '.item.id'
        }, data).should.be.eql({
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
        no.jpath('"foo-{{ bar }}"').should.be.eql('foo-{ bar }');
    });

    it('foo-{{ bar }}', function() {
        no.jpath.string('foo-{{ bar }}')().should.be.eql('foo-{ bar }');
    });

    it('.foo[ . == "\\\"hello\\\"" ]', function() {
        no.jpath('.foo[ . == "\\\"hello\\\"" ]', data).should.be.eql('"hello"');
    });

    it('.foo[ . == "\\"hello\\"" ]', function() {
        no.jpath('.foo[ . == "\\"hello\\"" ]', data).should.be.eql('"hello"');
    });

    it('.foo[ . == "\\hello\\" ]', function() {
        no.jpath('.bar[ . == "\\hello\\\\" ]', data).should.be.eql('\\hello\\');
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
        no.jpath('.foo.bar', data1).should.be.eql( [ [ 42, 24 ], 66 ] );
    });

    it('.foo.*', function() {
        no.jpath('.foo.bar', data1).should.be.eql( [ [ 42, 24 ], 66 ] );
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
        no.jpath('.foo.bar.boo', data2).should.be.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    });

    it('.foo.*.boo', function() {
        no.jpath('.foo.bar.boo', data2).should.be.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    });

    it('.foo.bar.*', function() {
        no.jpath('.foo.bar.boo', data2).should.be.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    });

    it('.foo.*.*', function() {
        no.jpath('.foo.bar.boo', data2).should.be.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    });

    it('.*.*.*', function() {
        no.jpath('.foo.bar.boo', data2).should.be.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jresults', function() {

    it('simplie object', function() {
        no.jpath({
            id: '.id',
            count: '.count'
        }, data).should.be.eql({
            count: 42,
            id: 'two'
        });
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

