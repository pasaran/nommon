var no = require('../lib/no.events.js');

var expect = require('expect.js');

//  ---------------------------------------------------------------------------------------------------------------  //

describe('sync', function() {

    it('trigger #1', function() {
        var foo = no.extend( {}, no.Events );

        var result;
        foo.on('foo', function(e, params) {
            result = params;
        });
        foo.trigger('foo', 42);

        expect(result).to.be(42);
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('async', function() {

    it('async trigger #1', function(done) {
        var foo = no.extend( {}, no.Events );

        var result;
        foo.on('foo', function(e, params) {
            result = params;
        });
        foo.atrigger('foo', 42);
        expect(result).to.be(undefined);

        no.next(function() {
            expect(result).to.be(42);
            done();
        });
    });

    it('async trigger #2', function(done) {
        var foo = no.extend( {}, no.Events );

        var result;
        foo.atrigger('foo', 42);
        foo.on('foo', function(e, params) {
            result = params;
        });
        expect(result).to.be(undefined);

        no.next(function() {
            expect(result).to.be(42);
            done();
        });
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe('off', function() {

    it('remove specific handler', function() {
        var foo = no.extend( {}, no.Events );
        var count = 0;
        var handler = function() { count++; };

        foo.on('foo', handler);
        foo.trigger('foo');
        expect(count).to.be(1);

        foo.off('foo', handler);
        foo.trigger('foo');
        expect(count).to.be(1);
    });

    it('remove all handlers of specific type', function() {
        var foo = no.extend( {}, no.Events );
        var calls = '';

        foo.on('foo', function() { calls += 'a'; });
        foo.on('foo', function() { calls += 'b'; });

        foo.trigger('foo');
        expect(calls).to.be('ab');

        foo.off('foo');
        foo.trigger('foo');
        expect(calls).to.be('ab');
    });

    it('remove all event handles', function() {
        var foo = no.extend( {}, no.Events );
        var calls = '';

        foo.on('foo', function() { calls += 'a'; });
        foo.on('bar', function() { calls += 'b'; });

        foo.trigger('foo');
        expect(calls).to.be('a');

        foo.trigger('bar');
        expect(calls).to.be('ab');

        foo.off();
        foo.trigger('foo');
        foo.trigger('bar');
        expect(calls).to.be('ab');
    });

});

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'once', function() {
    var foo = no.extend( {}, no.Events );

    it( 'once', function() {
        var n = 0;
        foo.once( 'foo', function() {
            n++;
        } );

        foo.trigger( 'foo' );
        expect( n ).to.be( 1 );
        foo.trigger( 'foo' );
        expect( n ).to.be( 1 );
    } );
} );

//  ---------------------------------------------------------------------------------------------------------------  //

