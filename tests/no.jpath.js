var no = require('../no.js');

require('should');

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
        no.jpath('.id', data).should.be.eql( [ 'two' ] );
    });

    it('.a.b', function() {
        no.jpath('.a.b', data).should.be.eql( [ 42 ] );
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

//  ---------------------------------------------------------------------------------------------------------------  //

describe('jpath with index', function() {

    it('.item[2].id', function() {
        no.jpath('.item[2].id', data).should.be.eql( [ 'three' ] );
    });

    it('.item[ /.index ].id', function() {
        no.jpath('.item[ /.index ].id', data).should.be.eql( [ 'three' ] );
    });

    it('.item[ index ].id', function() {
        no.jpath('.item[ index ].id', data, { index: 2 }).should.be.eql( [ 'three' ] );
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

    it('(.x + .y) * (.z + .t)', function() {
        no.jpath('(.x + .y) * (.z + .t)', data).should.be.eql(143);
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

