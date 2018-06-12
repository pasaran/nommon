/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */

var jpath = require( '../lib/jpath' );

var expect = require( 'expect.js' );

var _it = it;
it = function( id, callback ) {
    _it( id, function() {
        callback( id );
    } );
};

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

describe( 'simple jpath', function() {

    it( '.id', function() {
        expect( jpath( '.id', data ) ).to.be( 'two' );
    } );

    it( '.a.b', function() {
        expect( jpath( '.a.b', data ) ).to.be( 42 );
    } );

    it( '.item.id', function() {
        expect( jpath( '.item.id', data ) ).to.eql( [ 'one', 'two', 'three', 'four', 'five' ] );
    } );

    it( '.a.*', function() {
        expect( jpath( '.a.*', data ) ).to.eql( [ 42, 24, 66 ] );
    } );

    it( '.ids1', function() {
        expect( jpath( '.ids1', data ) ).to.eql( [ 'two', 'three', 'five' ] );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'jpath with predicate', function() {

    it( '.item{ .selected }.id', function() {
        expect( jpath( '.item{ .selected }.id', data ) ).to.eql( [ 'two', 'four' ] );
    } );

    it( '.item{ .count > 20 }.id', function() {
        expect( jpath( '.item{ .count > 20 }.id', data ) ).to.eql( [ 'one', 'four', 'five' ] );
    } );

    const data_1 = {
        result: {
            b: { id: 1, is_active: 42 },
            a: { id: 2, is_active: true },
            c: { id: 3, is_active: null },
            d: { id: 4, is_active: true },
            e: { id: 5, is_active: 0 }
        }
    };
    it( '.result.*{ .is_active === true }', function() {
        expect( jpath( '.result.*{ .is_active === true }', data_1 ) ).to.eql( [
            { id: 2, is_active: true },
            { id: 4, is_active: true }
        ] );
    } );

} );

describe( 'root or self with predicate', function() {

    it( '.{ .count > 0 }.count', function() {
        expect( jpath( '.{ .count > 0 }.count', data ) ).to.be( 42 );
    } );

    it( '.{ .count < 0 }.count', function() {
        expect( jpath( '.{ .count < 0 }.count', data ) ).to.be( undefined );
    } );

    it( '/{ .count > 0 }.count', function() {
        expect( jpath( '/{ .count > 0 }.count', data ) ).to.be( 42 );
    } );

    it( '/{ .count < 0 }.count', function() {
        expect( jpath( '/{.count < 0 }.count', data ) ).to.be( undefined );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'jpath with index', function() {

    it( '.item[ 2 ].id', function() {
        expect( jpath( '.item[ 2 ].id', data ) ).to.eql( 'three' );
    } );

    it( '.item[ /.index ].id', function() {
        expect( jpath( '.item[ /.index ].id', data ) ).to.eql( 'three' );
    } );

    it( '.[ key ]', function() {
        const data = {
            foo: 42,
            bar: 24,
        };

        const r = jpath( '.[ key ]', data, { key: 'foo' } );
        expect( r ).to.be( 42 );
    } );

    it( '.[ key1 ][ key2 ]', function() {
        const data = {
            foo: {
                bar: 42,
            },
        };

        const r = jpath( '.[ key1 ][ key2 ]', data, { key1: 'foo', key2: 'bar' } );
        expect( r ).to.be( 42 );
    } );

    it( '.item[ key ]', function() {
        const data = {
            item: [
                { foo: 42 },
                { foo: 24 },
                { foo: 66 },
            ],
        };

        const r = jpath( '.item[ key ]', data, { key: 'foo' } );
        expect( r ).to.be.eql( [ 42, 24, 66 ] );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'variables', function() {

    it( 'config.foo.bar', function() {
        expect( jpath( 'config.foo.bar', {}, { config: { foo: { bar: 42 } } } ) ).to.be( 42 );
    } );

    it( '.item[ index ].id', function() {
        expect( jpath( '.item[ index ].id', data, { index: 2 } ) ).to.eql( 'three' );
    } );

    it( 'index', function() {
        expect( jpath( 'index', {}, { index: 42 } ) ).to.be( 42 );
    } );

    it( 'config', function() {
        expect( jpath( 'config', {}, { config: { foo: 42 } } ) ).to.eql( { foo: 42 } );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'jpath with "guard"', function() {
    //  There are no guards anymore, but you can use "guard"-expression with &&.

    it( '( /.id === "two" ) && .item{ .selected }.id', function() {
        expect( jpath( '( /.id === "two" ) && .item{ .selected }.id', data ) ).to.eql( [ 'two', 'four' ] );
    } );

    it( '( /.id !== "two" ) && .item.id', function() {
        expect( jpath( '( /.id !== "two" ) && .item.id', data ) ).to.eql( false );
    } );

    it( '( /.id === "two" ) && .item{ .selected }.id', function() {
        expect( jpath( '( /.id === "two" ) && .item{ .selected }.id', data ) ).to.eql( [ 'two', 'four' ] );
    } );

    it( '( /.id !== "two" ) && .item{ .selected }.id', function() {
        expect( jpath( '( /.id !== "two" ) && .item{ .selected }.id', data ) ).to.eql( false );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'compare nodeset to nodeset', function() {

    it( '.item.id ~~ .ids1', function() {
        expect( jpath( '.item.id ~~ .ids1', data ) ).be.ok;
    } );

    it( '.item.id !~ .ids1', function() {
        expect( jpath( '.item.id !~ .ids1', data ) ).not.be.ok;
    } );

    it( '.item.id ~~ .ids2', function() {
        expect( jpath( '.item.id ~~ .ids2', data ) ).not.be.ok;
    } );

    it( '.item.id !== .ids2', function() {
        expect( jpath( '.item.id !~ .ids2', data ) ).be.ok;
    } );

    it( '.item.id ~~ .ids3', function() {
        expect( jpath( '.item.id ~~ .ids3', data ) ).be.ok;
    } );

    it( '.item.id !~ .ids3', function() {
        expect( jpath( '.item.id !~ .ids3', data ) ).not.be.ok;
    } );

    it( '.item{ .id ~~ /.ids1 }.id', function() {
        expect( jpath( '.item{ .id ~~ /.ids1 }.id', data ) ).to.eql( [ 'two', 'three', 'five' ] );
    } );

    it( '.item{ .id ~~ /.ids2 }.id', function() {
        expect( jpath( '.item{ .id ~~ /.ids2 }.id', data ) ).to.be.empty();
    } );

    it( '.item{ .id ~~ /.ids3 }.id', function() {
        expect( jpath( '.item{ .id ~~ /.ids3 }.id', data ) ).to.eql( [ 'one' ] );
    } );

    it( '.count ~~ .a.b', function() {
        expect( jpath( '.count ~~ .a.b', data ) ).be.ok;
    } );

    it( '.count ~~ .p.q', function() {
        expect( jpath( '.count ~~ .p.q', data ) ).not.be.ok;
    } );

    it( '.a.*{ . ~~ /.p.* }', function() {
        expect( jpath( '.a.*{ . ~~ /.p.* }', data ) ).to.eql( [ 24, 66 ] );
    } );

    it( '.item{ .count ~~ /.a.* }.id', function() {
        expect( jpath( '.item{ .count ~~ /.a.* }.id', data ) ).to.eql( [ 'one', 'five' ] );
    } );

    it( '.item{ .id ~~ /.id }.id', function() {
        expect( jpath( '.item{ .id ~~ /.id }.id', data ) ).to.eql( [ 'two' ] );
    } );

    it( '.ids1 ~~ .ids2', function() {
        expect( jpath( '.ids1 ~~ .ids2', data ) ).not.be.ok;
    } );

    it( '.ids2 ~~ .ids3', function() {
        expect( jpath( '.ids2 ~~ .ids3', data ) ).be.ok;
    } );

    it( '.ids1 ~~ "two"', function() {
        expect( jpath( '.ids1 ~~ "two"', data ) ).be.ok;
    } );

    it( '.ids1 !~ "two"', function() {
        expect( jpath( '.ids1 !~ "two"', data ) ).not.be.ok;
    } );

    it( '.ids1 ~~ "one"', function() {
        expect( jpath( '.ids1 ~~ "one"', data ) ).not.be.ok;
    } );

    it( '.ids1 !~ "one"', function() {
        expect( jpath( '.ids1 !~ "one"', data ) ).be.ok;
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'compare nodeset to scalar', function() {

    it( '.item.count ~~ 42', function() {
        expect( jpath( '.item.count ~~ 42', data ) ).be.ok;
    } );

    it( '.item.count !~ 42', function() {
        expect( jpath( '.item.count !~ 42', data ) ).not.be.ok;
    } );

    it( '.item.count ~~ 84', function() {
        expect( jpath( '.item.count ~~ 84', data ) ).not.be.ok;
    } );

    it( '.item.count !~ 84', function() {
        expect( jpath( '.item.count !~ 84', data ) ).be.ok;
    } );

    it( '.item.id ~~ "two"', function() {
        expect( jpath( '.item.id ~~ "two"', data ) ).be.ok;
    } );

    it( '.item.id !~ "two"', function() {
        expect( jpath( '.item.id !~ "two"', data ) ).not.be.ok;
    } );

    it( '.item{ .id ~~ "two" }', function() {
        expect( jpath( '.item{ .id ~~ "two" }.id', data ) ).to.eql( [ 'two' ] );
    } );

    it( '.item{ .id !~ "two" }', function() {
        expect( jpath( '.item{ .id !~ "two" }.id', data ) ).to.eql( [ 'one', 'three', 'four', 'five' ] );
    } );

    it( '.item{ .id !~ "" }', function() {
        expect( jpath( '.item{ .id !~ "" }.id', data ) ).to.eql( [ 'one', 'two', 'three', 'four', 'five' ] );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'arithmetic operations', function() {

    it( '+.count', function() {
        expect( jpath( '+.count', data ) ).to.be( 42 );
    } );

    it( '-.count', function() {
        expect( jpath( '-.count', data ) ).to.be( -42 );
    } );

    it( '.count + 5', function() {
        expect( jpath( '.count + 5', data ) ).to.be( 47 );
    } );

    it( '.count - 5', function() {
        expect( jpath( '.count - 5', data ) ).to.be( 37 );
    } );

    it( '.a.b + .a.c', function() {
        expect( jpath( '.a.b + .a.c', data ) ).to.be( 66 );
    } );

    it( '.a.b * .a.c', function() {
        expect( jpath( '.a.b * .a.c', data ) ).to.be( 1008 );
    } );

    it( '.a.b / .a.c', function() {
        expect( jpath( '.a.b / .a.c', data ) ).to.be( 1.75 );
    } );

    it( '.count % 17', function() {
        expect( jpath( '.count % 17', data ) ).to.be( 8 );
    } );

    it( '( .x + .y ) * ( .z + .t )', function() {
        expect( jpath( '( .x + .y ) * ( .z + .t )', data ) ).to.be( 143 );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'empty strings', function() {

    var data = {
        hello: 'Hello',
        empty: ''
    };

    it( '""', function() {
        expect( jpath( '""' ) ).to.eql( '' );
    } );

    it( '.hello !== ""', function() {
        expect( jpath( '.hello !== ""', data ) ).be.ok;
    } );

    it( '.hello === ""', function() {
        expect( jpath( '.hello === ""', data ) ).not.be.ok;
    } );

    it( '.empty !== ""', function() {
        expect( jpath( '.empty !== ""', data ) ).not.be.ok;
    } );

    it( '.empty === ""', function() {
        expect( jpath( '.empty === ""', data ) ).be.ok;
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'comparisons', function() {

    it( '.count > 20', function() {
        expect( jpath( '.count > 20', data ) ).be.ok;
    } );

    it( '.count < 20', function() {
        expect( jpath( '.count < 20', data ) ).not.be.ok;
    } );

    it( '.count >= 42', function() {
        expect( jpath( '.count >= 42', data ) ).be.ok;
    } );

    it( '.count <= 42', function() {
        expect( jpath( '.count <= 42', data ) ).be.ok;
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'priorities of operations', function() {

    it( '.x + .y * .z', function() {
        expect( jpath( '.x + .y * .z', data ) ).to.be( 25 );
    } );

    it( '9 - 2 - 3', function() {
        expect( jpath( '9 - 2 - 3', data ) ).to.be( 4 );
    } );

    it( '20 / 4 / 5', function() {
        expect( jpath( '20 / 4 / 5', data ) ).to.be( 1 );
    } );

    it( '.x * .y + .z', function() {
        expect( jpath( '.x * .y + .z', data ) ).to.be( 31 );
    } );

    it( '.x + 2 * .y < .z * 3 + .t', function() {
        expect( jpath( '.x + 2 * .y < .z * 3 + .t', data ) ).be.ok;
    } );

    it( '.x === 5 || .y === 7 && .z === 4', function() {
        expect( jpath( '.x === 5 || .y === 7 && .z === 4', data ) ).not.be.ok;
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'falsy jpaths', function() {

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

    it( 'true', function() {
        expect( jpath( '.foo{ .a }.c', data ) ).to.be( 42 );
    } );

    it( 'non-empty string', function() {
        expect( jpath( '.foo{ .b }.c', data ) ).to.be( 42 );
    } );

    it( 'non-zero number', function() {
        expect( jpath( '.foo{ .c }.c', data ) ).to.be( 42 );
    } );

    it( 'empty string', function() {
        expect( jpath( '.foo{ .d }.c', data ) ).to.be( undefined );
    } );

    it( 'zero', function() {
        expect( jpath( '.foo{ .e }.c', data ) ).to.be( undefined );
    } );

    it( 'null', function() {
        expect( jpath( '.foo{ .f }.c', data ) ).to.be( undefined );
    } );

    it( 'false', function() {
        expect( jpath( '.foo{ .g }.c', data ) ).to.be( undefined );
    } );

    it( 'undefined', function() {
        expect( jpath( '.foo{ .h }.c', data ) ).to.be( undefined );
    } );

    it( 'non-existence key', function() {
        expect( jpath( '.foo{ .z }.c', data ) ).to.be( undefined );
    } );

} );

describe( 'walk through null', function() {

    var data = {
        foo: null,

        bar: [
            null
        ],

        quu: [
            {
                foo: null
            }
        ],

        boo: {
            foo: null
        }
    };

    it( '.foo', function() {
        expect( jpath( '.foo', data ) ).to.be( null );
    } );

    it( '.bar', function() {
        expect( jpath( '.bar', data ) ).to.be.eql( [ null ] );
    } );

    it( '.foo.bar', function() {
        expect( jpath( '.foo.bar', data ) ).to.be( undefined );
    } );

    it( '.foo.bar.quu', function() {
        expect( jpath( '.foo.bar.quu', data ) ).to.be( undefined );
    } );

    it( '.bar.foo', function() {
        expect( jpath( '.bar.foo', data ) ).to.be.eql( [] );
    } );

    it( '.bar.foo.quu', function() {
        expect( jpath( '.bar.foo.quu', data ) ).to.be.eql( [] );
    } );

    it( '.quu.foo.bar', function() {
        expect( jpath( '.quu.foo.bar', data ) ).to.be.eql( [] );
    } );

    it( '.boo.foo.quu', function() {
        expect( jpath( '.boo.foo.quu', data ) ).to.be( undefined );
    } );
} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'short-circuit evaluation', function() {

    var data = {
        a: 0,
        b: false,
        c: '',
        //  d: undefined
        e: 24,
        f: true,
        g: 'foo'
    };

    it( '.a || 42', function() {
        expect( jpath( '.a || 42', data ) ).to.be( 42 );
    } );

    it( '.b || 42', function() {
        expect( jpath( '.b || 42', data ) ).to.be( 42 );
    } );

    it( '.c || 42', function() {
        expect( jpath( '.c || 42', data ) ).to.be( 42 );
    } );

    it( '.d || 42', function() {
        expect( jpath( '.d || 42', data ) ).to.be( 42 );
    } );

    it( '.a || .b || .c || .d || 42', function() {
        expect( jpath( '.a || .b || .c || .d || 42', data ) ).to.be( 42 );
    } );

    it( '.e || 42', function() {
        expect( jpath( '.e || 42', data ) ).to.be( 24 );
    } );

    it( '.f || 42', function() {
        expect( jpath( '.f || 42', data ) ).to.be( true );
    } );

    it( '.g || 42', function() {
        expect( jpath( '.g || 42', data ) ).to.be( 'foo' );
    } );

    it( '.a === 0 && .g === "foo"', function() {
        expect( jpath( '.a === 0 && .g === "foo"', data ) ).to.be( true );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'ternary operator', function() {

    var data = {
        foo: 42,
        bar: 24,
        quu: 94,
        tee: 26,
        doo: 37
    };

    it( '.foo > 40 ? .bar : .quu', function( id ) {
        expect( jpath( id, data ) ).to.be( 24 );
    } );

    it( '.foo > 40 ? .bar : .quu', function( id ) {
        expect( jpath( id, data ) ).to.be( 24 );
    } );

    it( '( .foo > 40 ) ? .bar : .quu', function( id ) {
        expect( jpath( id, data ) ).to.be( 24 );
    } );

    it( '.foo > 40 ? "bar" : 42', function( id ) {
        expect( jpath( id, data ) ).to.be( 'bar' );
    } );

    it( '.foo ? .bar ? .quu : .tee : .doo', function( id ) {
        expect( jpath( id, data ) ).to.be( 94 );
    } );

    it( '!.foo ? .bar ? .quu : .tee : .doo', function( id ) {
        expect( jpath( id, data ) ).to.be( 37 );
    } );

    it( '.foo ? !.bar ? .quu : .tee : .doo', function( id ) {
        expect( jpath( id, data ) ).to.be( 26 );
    } );

    it( 'FOO { .foo ? "FOO-{ .foo }" : "BAR" } BAR', function( id ) {
        expect( jpath.string( id )( { foo: 'QUU' } ) ).to.be( 'FOO FOO-QUU BAR' );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'string interpolation', function() {

    var data = {
        foo: {
            bar: 'hello'
        },
        a: 'he',
        b: 'll',
        c: 'o'
    };

    it( '"{ .a }{ .b }"', function() {
        expect( jpath( '"{ .a }{ .b }{ .c }"', data ) ).to.be( 'hello' );
    } );

    it( '.foo.bar{ . === "hello" }', function() {
        expect( jpath( '.foo.bar{ . === "hello" }', data ) ).to.be( 'hello' );
    } );

    it( '.foo.bar{ . === "{ /.a }llo" }', function() {
        expect( jpath( '.foo.bar{ . === "{ /.a }llo" }', data ) ).to.be( 'hello' );
    } );

    it( '.foo.bar{ . === "{ /.a }ll{ /.c }" }', function() {
        expect( jpath( '.foo.bar{ . === "{ /.a }ll{ /.c }" }', data ) ).to.be( 'hello' );
    } );

    it( '.foo.bar{ . === "{ /.a }{ /.b }{ /.c }" }', function() {
        expect( jpath( '.foo.bar{ . === "{ /.a }{ /.b }{ /.c }" }', data ) ).to.be( 'hello' );
    } );

    it( '"{ .foo }"', function() {
        expect( jpath( '"{ .foo }"', data ) ).to.be( '' );
    } );

    it( '"{ .bar }"', function() {
        expect( jpath( '"{ .bar }"', data ) ).to.be( '' );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'funcs', function() {

    it( 'enc', function() {
        const data = {
            text: 'Привет'
        };

        const r = jpath( '"http://yandex.ru/yandsearch?text={ enc( .text ) }"', data );
        expect( r ).to.be( 'http://yandex.ru/yandsearch?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82' );
    } );

    it( 'encodeURIComponent', function() {
        const data = {
            text: 'Привет'
        };

        const r = jpath( '"http://yandex.ru/yandsearch?text={ encodeURIComponent( .text ) }"', data );
        expect( r ).to.be( 'http://yandex.ru/yandsearch?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82' );
    } );

    it( 'sum', function() {
        const data = {
            a: 42,
            b: 24,
        };

        const r = jpath( 'sum( .a, .b, c )', data, {
            sum: function( a, b, c ) {
                return a + b + c;
            },
            c: 22,
        } );
        expect( r ).to.be( 88 );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'jresult', function() {

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

    it( 'jresult #1', function() {
        expect( jpath( {
            selected: '.item{ .selected }'
        }, data ) ).to.eql( {
            selected: [
                { id: 'two', count: 13, selected: true },
                { id: 'four', count: 59, selected: true }
            ]
        } );
    } );

    it( 'jresult #2', function() {
        expect( jpath( {
            foo: '.foo.bar',
            ids: '.item.id'
        }, data ) ).to.eql( {
            foo: {
                first: 1,
                second: 2,
                third: 3
            },
            ids: [ 'one', 'two', 'three', 'four', 'five' ]
        } );
    } );

} );

describe( 'escape symbols', function() {

    var data = {
        foo: '"hello"',
        bar: '\\hello\\'
    };

    it( '"foo-{{ bar }}"', function() {
        expect( jpath( '"foo-{{ bar }}"' ) ).to.be( 'foo-{ bar }' );
    } );

    it( 'foo-{{ bar }}', function() {
        expect( jpath.string( 'foo-{{ bar }}' )() ).to.be( 'foo-{ bar }' );
    } );

    it( '.foo{ . === "\\\"hello\\\"" }', function() {
        expect( jpath( '.foo{ . === "\\\"hello\\\"" }', data ) ).to.be( '"hello"' );
    } );

    it( '.foo{ . === "\\"hello\\"" }', function() {
        expect( jpath( '.foo{ . === "\\"hello\\"" }', data ) ).to.be( '"hello"' );
    } );

    it( '.foo{ . === "\\hello\\" }', function() {
        expect( jpath( '.bar{ . === "\\hello\\\\" }', data ) ).to.be( '\\hello\\' );
    } );

} );

//  Обсуждение вложенных массивов.
//  https://github.com/pasaran/nommon/issues/5
//
describe( 'nested arrays', function() {

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

    it( '.foo.bar', function() {
        expect( jpath( '.foo.bar', data1 ) ).to.eql( [ [ 42, 24 ], 66 ] );
    } );

    it( '.foo.*', function() {
        expect( jpath( '.foo.bar', data1 ) ).to.eql( [ [ 42, 24 ], 66 ] );
    } );

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

    it( '.foo.bar.boo', function() {
        expect( jpath( '.foo.bar.boo', data2 ) ).to.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    } );

    it( '.foo.*.boo', function() {
        expect( jpath( '.foo.bar.boo', data2 ) ).to.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    } );

    it( '.foo.bar.*', function() {
        expect( jpath( '.foo.bar.boo', data2 ) ).to.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    } );

    it( '.foo.*.*', function() {
        expect( jpath( '.foo.bar.boo', data2 ) ).to.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    } );

    it( '.*.*.*', function() {
        expect( jpath( '.foo.bar.boo', data2 ) ).to.eql( [ [ 42, 24 ], 66, 73, [ 29, 44 ] ] );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'jresults', function() {

    it( 'simple object', function() {
        expect( jpath( {
            id: '.id',
            count: '.count'
        }, data ) ).to.eql( {
            count: 42,
            id: 'two'
        } );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'bugs', function() {

    it( 'bug #1', function() {
        var r = jpath( 'foo.bar > 0', {}, { foo: { bar: 42 } } );
        expect( r ).to.be( true );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'jpath.string', function() {

    it( 'quotes in jstring', function() {
        expect( jpath.string( 'Hello, "nop"' )() ).to.be( 'Hello, "nop"' );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'true, false, null, undefined', function() {
    var data = {
        a: 42,
        b: true,
        c: 0,
        d: '',
        e: false,
        f: null,
        g: undefined
    };

    it( 'true', function() {
        expect( jpath( '.a === true', data ) ).to.be( false );
        expect( jpath( '.b === true', data ) ).to.be( true );
    } );

    it( 'false', function() {
        expect( jpath( '.c === false', data ) ).to.be( false );
        expect( jpath( '.d === false', data ) ).to.be( false );
        expect( jpath( '.e === false', data ) ).to.be( true );
        expect( jpath( '.f === false', data ) ).to.be( false );
        expect( jpath( '.g === false', data ) ).to.be( false );
    } );

    it( 'null', function() {
        expect( jpath( '.c === null', data ) ).to.be( false );
        expect( jpath( '.d === null', data ) ).to.be( false );
        expect( jpath( '.e === null', data ) ).to.be( false );
        expect( jpath( '.f === null', data ) ).to.be( true );
        expect( jpath( '.g === null', data ) ).to.be( false );
        expect( jpath( '.f === .g', data ) ).to.be( false );
        expect( jpath( '.f == .g', data ) ).to.be( true );
    } );

    it( 'undefined', function() {
        expect( jpath( '.c === undefined', data ) ).to.be( false );
        expect( jpath( '.d === undefined', data ) ).to.be( false );
        expect( jpath( '.e === undefined', data ) ).to.be( false );
        expect( jpath( '.f === undefined', data ) ).to.be( false );
        expect( jpath( '.g === undefined', data ) ).to.be( true );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( '== vs ===', function() {
    var data = {
        a: 42,
        b: '42',
        c: '',
        d: 0
    };

    it( '.a === .b', function() {
        expect( jpath( '.a === .b', data ) ).to.be( false );
    } );
    it( '.a == .b', function() {
        expect( jpath( '.a == .b', data ) ).to.be( true );
    } );
    it( '.c === .d', function() {
        expect( jpath( '.c === .d', data ) ).to.be( false );
    } );
    it( '.c == .d', function() {
        expect( jpath( '.c == .d', data ) ).to.be( true );
    } );

} );

//  ---------------------------------------------------------------------------------------------------------------  //

