/* eslint-env mocha */

const jsetter = require( '../lib/jsetter' );

const expect = require( 'expect.js' );

describe( 'jsetter', function() {

    it( '.a.b #1', function() {
        const data = {
            a: {
                b: 42,
            },
            c: {
                d: 66,
            },
        };

        const r = jsetter( '.a.b' )( data, null, 24 );

        expect( r ).to.be.eql( {
            a: {
                b: 24
            },
            c: {
                d: 66,
            },
        } );
        expect( r ).not.to.be( data );
        expect( r.a ).not.to.be( data.a );
        expect( r.c ).to.be( data.c );
    } );

    it( '.a.b #2', function() {
        const data = {};

        const r = jsetter( '.a.b' )( data, null, 42 );

        expect( r ).to.be( data );
        expect( r ).to.be.eql( {} );
    } );

    it( '.chat_list{ .chat_id === chat_id }.messages{ .message_id === message_id }.status', function() {
        const data = {
            chat_list: [
                {
                    chat_id: '1',
                    messages: [
                        {
                            message_id: '1',
                            status: false,
                        },
                        {
                            message_id: '2',
                            status: false,
                        },
                    ],
                },
                {
                    chat_id: '2',
                    messages: [
                        {
                            message_id: '1',
                            status: false,
                        },
                        {
                            message_id: '2',
                            status: false,
                        },
                    ],
                },
            ],
        };

        const r = jsetter( '.chat_list{ .chat_id === chat_id }.messages{ .message_id === message_id }.status' )( data, {
            chat_id: '1',
            message_id: '2',
        }, true );

        expect( r ).not.to.be( data );
        expect( r.chat_list ).not.to.be( data.chat_list );
        expect( r.chat_list[ 0 ] ).not.to.be( data.chat_list[ 0 ] );
        expect( r.chat_list[ 1 ] ).to.be( data.chat_list[ 1 ] );
        expect( r.chat_list[ 0 ].messages ).not.to.be( data.chat_list[ 0 ].messages );
        expect( r.chat_list[ 0 ].messages[ 0 ] ).to.be( data.chat_list[ 0 ].messages[ 0 ] );
        expect( r.chat_list[ 0 ].messages[ 1 ] ).not.to.be( data.chat_list[ 0 ].messages[ 1 ] );
        expect( r.chat_list[ 0 ] ).to.be.eql( {
            chat_id: '1',
            messages: [
                {
                    message_id: '1',
                    status: false,
                },
                {
                    message_id: '2',
                    status: true,
                },
            ],
        } );
    } );

    it( '.item[ 1 ].status', function() {
        const data = {
            item: [
                { id: '1', status: false },
                { id: '2', status: false },
                { id: '3', status: false },
            ],
        };

        const r = jsetter( '.item[ 1 ].status' )( data, null, true );

        expect( r ).to.be.eql( {
            item: [
                { id: '1', status: false },
                { id: '2', status: true },
                { id: '3', status: false },
            ],
        } );
        expect( r ).not.to.be( data );
        expect( r.item ).not.to.be( data.item );
        expect( r.item[ 0 ] ).to.be( data.item[ 0 ] );
        expect( r.item[ 1 ] ).not.to.be( data.item[ 1 ] );
        expect( r.item[ 2 ] ).to.be( data.item[ 2 ] );
    } );

    it( '.item[ index ].status', function() {
        const data = {
            item: [
                { id: '1', status: false },
                { id: '2', status: false },
                { id: '3', status: false },
            ],
        };

        const r = jsetter( '.item[ index ].status' )( data, { index: 1 }, true );

        expect( r ).to.be.eql( {
            item: [
                { id: '1', status: false },
                { id: '2', status: true },
                { id: '3', status: false },
            ],
        } );
        expect( r ).not.to.be( data );
        expect( r.item ).not.to.be( data.item );
        expect( r.item[ 0 ] ).to.be( data.item[ 0 ] );
        expect( r.item[ 1 ] ).not.to.be( data.item[ 1 ] );
        expect( r.item[ 2 ] ).to.be( data.item[ 2 ] );
    } );

} );

describe( 'jsetter.delete', function() {

    it( '.foo', function() {
        const data = {
            foo: 42,
            bar: {
                quu: 24,
            },
        };

        const r = jsetter.delete( '.foo' )( data );

        expect( r ).to.be.eql( {
            bar: {
                quu: 24,
            },
        } );
        expect( r ).not.to.be( data );
        expect( r.bar ).to.be( data.bar );
    } );

    it( '.bar.quu', function() {
        const data = {
            foo: 42,
            bar: {
                quu: 24,
            },
        };

        const r = jsetter.delete( '.bar.quu' )( data );

        expect( r ).to.be.eql( {
            foo: 42,
            bar: {},
        } );
        expect( r ).not.to.be( data );
        expect( r.bar ).not.to.be( data.bar );
    } );

    it( '.item{ .count > 2 }', function() {
        const data = {
            item: [
                { id: '1', count: 5 },
                { id: '2', count: 1 },
                { id: '3', count: 2 },
                { id: '4', count: 7 },
                { id: '5', count: 3 },
            ],
        };

        const r = jsetter.delete( '.item{ .count > 2 }' )( data );

        expect( r ).to.be.eql( {
            item: [
                { id: '2', count: 1 },
                { id: '3', count: 2 },
            ],
        } );
        expect( r ).not.to.be( data );
        expect( r.item ).not.to.be( data.item );
        expect( r.item[ 0 ] ).to.be( data.item[ 1 ] );
        expect( r.item[ 1 ] ).to.be( data.item[ 2 ] );
    } );

    it( '.item[ 1 ]', function() {
        const data = {
            item: [
                { id: '1' },
                { id: '2' },
                { id: '3' },
            ],
        };

        const r = jsetter.delete( '.item[ 1 ]' )( data );

        expect( r ).to.be.eql( {
            item: [
                { id: '1' },
                { id: '3' },
            ],
        } );
        expect( r ).not.to.be( data );
        expect( r.item ).not.to.be( data.item );
        expect( r.item[ 0 ] ).to.be( data.item[ 0 ] );
        expect( r.item[ 1 ] ).to.be( data.item[ 2 ] );
    } );

    it( '.item[ index ]', function() {
        const data = {
            item: [
                { id: '1' },
                { id: '2' },
                { id: '3' },
            ],
        };

        const r = jsetter.delete( '.item[ index ]' )( data, { index: 1 } );

        expect( r ).to.be.eql( {
            item: [
                { id: '1' },
                { id: '3' },
            ],
        } );
        expect( r ).not.to.be( data );
        expect( r.item ).not.to.be( data.item );
        expect( r.item[ 0 ] ).to.be( data.item[ 0 ] );
        expect( r.item[ 1 ] ).to.be( data.item[ 2 ] );
    } );

    it( '.item{ .id === id }', function() {
        const data = {
            item: [
                { id: '1' },
                { id: '2' },
                { id: '3' },
                { id: '4' },
                { id: '5' },
            ],
        };

        const r = jsetter.delete( '.item{ .id === id }' )( data, { id: '4' } );

        expect( r ).to.be.eql( {
            item: [
                { id: '1' },
                { id: '2' },
                { id: '3' },
                { id: '5' },
            ],
        } );
        expect( r ).not.to.be( data );
        expect( r.item ).not.to.be( data.item );
        expect( r.item[ 0 ] ).to.be( data.item[ 0 ] );
        expect( r.item[ 1 ] ).to.be( data.item[ 1 ] );
        expect( r.item[ 2 ] ).to.be( data.item[ 2 ] );
        expect( r.item[ 3 ] ).to.be( data.item[ 4 ] );
    } );

    it( '.item{ .count > 2 }.foo', function() {
        const data = {
            item: [
                { id: '1', count: 5, foo: 'a' },
                { id: '2', count: 2, foo: 'b' },
                { id: '3', count: 7, foo: 'c' },
                { id: '4', count: 1, foo: 'd' },
            ],
        };

        const r = jsetter.delete( '.item{ .count > 2 }.foo' )( data );

        expect( r ).to.be.eql( {
            item: [
                { id: '1', count: 5 },
                { id: '2', count: 2, foo: 'b' },
                { id: '3', count: 7 },
                { id: '4', count: 1, foo: 'd' },
            ],
        } );
        expect( r ).not.to.be( data );
        expect( r.item ).not.to.be( data.item );
        expect( r.item[ 0 ] ).not.to.be( data.item[ 0 ] );
        expect( r.item[ 1 ] ).to.be( data.item[ 1 ] );
        expect( r.item[ 2 ] ).not.to.be( data.item[ 2 ] );
        expect( r.item[ 3 ] ).to.be( data.item[ 3 ] );

    } );

} );

describe( 'jsetter.push', function() {

    it( '.item', function() {
        const data = {
            item: [
                { id: 1 },
                { id: 2 },
            ],
        };

        const new_item = {
            id: 3
        };
        const r = jsetter.push( '.item' )( data, null, new_item );

        expect( r ).to.be.eql( {
            item: [
                { id: 1 },
                { id: 2 },
                { id: 3 },
            ],
        } );
        expect( r ).not.to.be( data );
        expect( r.item ).not.to.be( data.item );
        expect( r.item[ 0 ] ).to.be( data.item[ 0 ] );
        expect( r.item[ 1 ] ).to.be( data.item[ 1 ] );
        expect( r.item[ 2 ] ).to.be( new_item );

    } );

    it( '.chat_list{ .chat_id === chat_id }.messages', function() {
        const data = {
            chat_list: [
                {
                    chat_id: '1',
                    messages: [
                        {
                            message_id: '1',
                        },
                    ],
                },
                {
                    chat_id: '2',
                    messages: [
                        {
                            message_id: '1',
                        },
                    ],
                },
            ],
        };

        const new_message = {
            message_id: '2',
        };
        const r = jsetter.push( '.chat_list{ .chat_id === chat_id }.messages' )( data, { chat_id: '2' }, new_message );

        expect( r ).to.be.eql( {
            chat_list: [
                {
                    chat_id: '1',
                    messages: [
                        {
                            message_id: '1',
                        },
                    ],
                },
                {
                    chat_id: '2',
                    messages: [
                        {
                            message_id: '1',
                        },
                        {
                            message_id: '2',
                        },
                    ],
                },
            ],
        } );
        expect( r ).not.to.be( data );
        expect( r.chat_list ).not.to.be( data.chat_list );
        expect( r.chat_list[ 0 ] ).to.be( data.chat_list[ 0 ] );
        expect( r.chat_list[ 1 ].messages ).not.to.be( data.chat_list[ 1 ].messages );
        expect( r.chat_list[ 1 ].messages[ 0 ] ).to.be( data.chat_list[ 1 ].messages[ 0 ] );
        expect( r.chat_list[ 1 ].messages[ 1 ] ).to.be( new_message );
    } );

} );

