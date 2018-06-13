# jpath

`jpath` — аналог XPath выражений для JS объектов:

    no = require( 'nommon' )

    data = {
        foo: {
            bar: 42,
        },
    }
    no.jpath( '.foo.bar', data )
    //  42

Не падает, если в `data` нет соответствующих свойств:

    data = {}
    no.jpath( '.foo.bar', data )
    //  undefined

Также работает с массивами:

    data = {
        foo: [
            { bar: 42 },
            { bar: 24 },
            { bar: 33 },
        ],
    }
    no.jpath( '.foo.bar', data )
    //  [ 42, 24, 33 ]


## Структура jpath

jpath состоит из последовательности шагов, которые бывают четырех типов:

  * `.foo`
  * `.*`
  * `{ expr }`
  * `[ expr ]`

Первый шаг применяется к значению, переданному вторым аргументом в `no.jpath`,
второй шаг к тому, что получилось на первом шаге и т.д.
Если на каком-то шаге получился `undefined`, то на этом выполнение заканчивается и результатом
будет `undefined`.


### `.foo`

    no.jpath( '.foo', data )

Если мы применяем `.foo` не к массиву, то этот шаг примерно соответствует выражению `data.foo`.

    data = {
        foo: 42,
    }

    no.jpath( '.foo', data )
    //  42

    no.jpath( '.foo.bar', data )
    //  undefined

    no.jpath( '.bar', data )
    //  undefined

    no.jpath( '.bar.foo', data )
    //  undefined

Если же это массив, то результатом будет (примерно) массив, элементами которого будут результаты применения `.foo` к каждому элементу `data`.

    data = {
        foo: [
            { bar: 42 },
            { bar: 24 },
            { bar: null },
            //  { bar: undefined },
            {},
            { bar: 33 },
        ],
    }

    no.jpath( '.foo', data )
    //  [ { bar: 42 }, { bar: 24 }, { bar: null }, {}, { bar: 33 } ]

    no.jpath( '.foo.bar', data )
    //  [ 42, 24, null, 33 ]

Значения `undefined` отфильтровываются, а `null` считается допустимым значением.


### `.*`

Если применяется к объекту, то мы берем для каждого ключа `key` результат `.key`
и объединяем полученное в один массив:

    data = {
        foo: 42,
        bar: 24,
        quu: 33,
    }
    no.jpath( '.*', data )
    //  [ 42, 24, 33 ]

    data = {
        a: {
            b: 1,
            c: 2,
        },
        d: {
            e: 3,
            f: 4,
        },
    }
    no.jpath( '.*.*', data );
    //  [ 1, 2, 3, 4 ]

Если на каком-то шаге `.*` применяется к массиву, то `.*` применяется к каждому его элементу и результат опять склеивается в один массив:

    data = {
        a: [
            { b: 1 },
            { c: 2 },
        ],
        d: [
            { e: 3 },
            { f: 4 },
        ],
    }
    no.jpath( '.*.*', data )
    //  [ 1, 2, 3, 4 ]


### `{ expr }`

Предикат, фильтр.

Если на предыдущем шаге получился массив, то это аналог `Array.prototype.filter`.
Результатом применения предиката к массиву всегда будет массив:

    data = {
        item: [
            { id: '1' },
            { id: '2', selected: true },
            { id: '3' },
        ],
    }

    no.jpath( '.item{ .selected }', data )
    //  [ { id: '2', selected: true } ]

Здесь выражение `.selected` вычисляется в контексте элементов массива, к которому применяется предикат.
Можно примерно то же самое записать в js:

    data.item.filter( item => no.jpath( '.selected', item ) )

Если ни для одного элемента массива предикат не вычислился в `true`, результатом будет пустой массив:

    no.jpath( '.item{ .id === '4' }', data )
    //  []


Если предикат применяется не к массиву, то мы либо получаем `undefined`, если предикат вычисляется в falsy-значение,
либо же результат предыдущего шага:

    data = {
        foo: {
            id: '1',
            selected: true,
        },
        bar: {
            id: '2',
        },
    }

    no.jpath( '.foo{ .selected }', data )
    //  data.foo

    no.jpath( '.bar{ .selected }', data )
    //  undefined


Внутри `expr` мы можем использовать переменные и функции.

Передаем их третьим аргументом функции `jpath`:

    data = {
        item: [
            { id: '1', count: 5 },
            { id: '2', count: 7, selected },
            { id: '3', count: 3 },
        ],
    }

    no.jpath( '.item{ .id === id }.count', data, {
        id: '2'
    } )
    //  [ 7 ]


    no.jpath( '.item{ .count === max( /.item.count ) }.id', data, {
        max: function( items ) {
            return Math.max.apply( null, items );
        },
    } )
    //  [ '2' ]

В последнем примере используется "абсолютный" jpath: `/.item.count`.
Если jpath начинается с символа `/`, то он вычисляется не в текущем контексте (в этом примере это были бы
элементы массива), а в контексте исходной `data`.
Тут нужно отметить, что `max( /.item.count )` не зависит на самом деле от текущего item'а,
но вычисляется таки каждый раз, для всех элементов массива, что не очень хорошо.
Лучше бы сделать как-то так:

    no.jpath( '.item{ .count === max_count }.id', data, {
        max_count: no.jpath( 'max( /.item.count )', data, {
            max: function( items ) {
                return Math.max.apply( null, items );
            },
        } ),
    } )

Внутри предикатов можно использовать более-менее обычные js-операторы и значения:

    no.jpath( '.item{ .id === "2" }'.id', data )
    //  [ '2' ]

    no.jpath( '.item{ .count > 4 && .selected }.id', data )
    //  [ '2' ]

Суммируем, выражения могут содержать:

  * `"foo"` — строки
  * `"id-{ .id }"` — строки с интерполяцией
  * `42` — числа
  * `true`, `false`, `null`, `undefined`
  * `-`, `+`, `!` — унарные операторы
  * `+`, `-`, `*`, `/`, `%` — бинарные операторы
  * `<`, `<=`, `>`, `>=`, `==`, `!=`, `===`, `!==` — операторы сравнения
  * `&&`, `||` — логические операторы
  * jpath


### `[ expr ]`

Индекс, если применяется к массиву, или свойство объекта.

    data = {
        item: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
        ],
    }

    no.jpath( '.item[ 1 ]', data )
    //  { id: '2' }

    no.jpath( '.item[ index ]', data, { index: 1 } )
    //  { id: '2' }


    data = {
        foo: {
            bar: 42,
        },
    }
    no.jpath( '.[ key1 ][ key2 ]', data, { key1: 'foo', key2: 'bar' } )
    //  42

Внутри `[ ... ]` может быть не только число или переменная, но любое выражение — такое же,
как и в случае с предикатом. Но есть нюанс. В предикате выражение вычисляется в контексте каждого элемента массива,
а индекс вычисляется один раз и в контексте массива, к которому применяется индекс:

    data = {
        item: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
        ],
    }
    no.jpath( '.item[ length( . ) - 1 ]', data )
    //  Последний элемент массива.
    //  { id: '3' }

Функция `length` встроенная, работает для строк и массивов.

Замечание: вот так не сработает `.item[ .length - 1 ]`. Потому что когда мы применяем jpath `.length` к массиву,
мы применяем его к каждому элементу массива:

    data = {
        item: [
            'hello',
            'bye',
        ]
    }
    no.jpath( '.item.length', data )
    //  [ 5, 3 ]

Не совсем то, что нужно :)
Поэтому правильно так:

    no.jpath( 'length( .item )', data )
    //  2


## jpath vs jpath expression

Вопрос терминологии:

  * jpath — это последовательность шагов четырех видов.
  * jexpr — это то, что может быть внутри `{ ... }` и `[ ... ]`. Т.е. и jpath, и всевозможные выражения,
    составленные из строк, чисел, jpath'ов и разнообразных js-операторов.

        //  jpath
        .foo
        .foo.bar
        .foo{ .bar }

        // jexpr
        .foo + .bar
        .count > 0
        length( .item )


## Функции

Как уже выше говорилось, можно передать объект с переменными и функциями и использовать их
внутри jexpr. Помимо этого есть (пока что) две встроенные функции:

  * `length` — длина строк и массивов.
  *  `enc` — алиас для `encodeURIComponent`.

Кроме того, все функции из global/window так же доступны:

    no.jpath( 'encodeURIComponent( .text )', { text: 'Привет' } )


## API

Исторически сложившееся API выглядит вот так (видимо, в ближайшее время это изменится):

### `no.jpath`

Скомпилировать jexpr и тут же вычислить его:

    no.jpath( jpath, data, vars )

Да, по факту компилируется не только jpath, а произвольное jpath expression,
но функция называется jpath :(

`vars` — объект с переменными и функциями.

### `no.jpath.expr`

Просто скомпилировать jexpr:

    compiled = no.jpath.expr( jpath )
    result = compiled( data, root, vars )

`root` здесь это тот объект, от которого считаются абсолютные jpath'ы, т.е. начинающиеся с `/`.
В большинстве случаев тут имеет смысл передавать `data`:

    result = compiled( data, data, vars )

Опять таки: так получилось )

### `no.jpath.string`

Это специальное jpath-выражение: содержимое строки. Строка в jpath всегда заключена в двойные кавычки:

    path = no.jpath.expr( '"/api/message/{ .id }/"' )( { id: '1234' } )

Немножко коряво. Для конкретно этой ситуации есть `no.jpath.string`:

    compiled = no.jpath.string( '/api/message/{ .id }/' )
    path = compiled( { id: '1234' } )

Если вы не уверены в значениях, подставляемых внутрь строки, которую потом будете использовать в качестве урла,
имеет смысл заенкодить эти значения:

    no.jpath.string( '/api/message/{ enc( .id ) }/' )
