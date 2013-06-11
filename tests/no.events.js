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

