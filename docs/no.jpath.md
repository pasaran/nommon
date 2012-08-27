JPath
=====

    var data = {
        foo: {
            bar: 42
        }
    }

    //  [ { bar: 42 } ]
    no.jpath('.foo', data)

    //  [ 42 ]
    no.jpath('.foo.bar', data)

    //  []
    no.jpath('.bar.foo', data)


Predicates and indexes
----------------------

    var data = {
        count: 30,
        index: 2,
        item: [
            { id: 'one', count: 42 },
            { id: 'two', count: 24, selected: true },
            { id: 'three', count: 17 },
            { id: 'four', count: 29, selected: true },
            { id: 'five', count: 66 }
        ]
    };

    no.path('.item[ .selected ]', data)

    no.path('.item[ .count > 20 ]', data)

    no.path('.item[ .count > /.count ]', data)

    no.path('.item[ .selected ].count[ . > 20 ]', data)

    no.path('.item[2]', data)

    no.path('.item[ /.index ]', data)

    no.path('.item[ .id == "two" || .count + 1 > 20 ]', data)

Variables
---------

    no.path('.item[ .id == id ]', data, { id: "two" })

    no.path('.item[i]', data, { i: 2 })


