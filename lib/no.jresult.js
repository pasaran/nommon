/*

    result = {
        'foo': '.foo.bar',
        '{ .bar }': '"Hello, { .username }"'
    }

*/

jpath.compile

jpath.select

jp = jpath.compile({
    'foo': '.foo.bar',
    '{ .bar }': '"Hello, { .username }"'
})

jp.select(data)

