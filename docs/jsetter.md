# jsetter

Хелпер для React/Redux для создания модифицированных копий объектов (стейта приложения, например).
Аналог [immutability-helper](https://github.com/kolodny/immutability-helper), но в более-менее [jpath синтаксисе](./jpath.md).

## `no.jsetter`

```js
data = {
    a: {
        b: 42,
    },
    c: {
        d: 24,
    },
}
r = no.jsetter( '.a.b' )( data, null, 66 )
/*
{
    a: {
        b: 66,
    },
    c: {
        d: 24,
    }
}
*/
```

При этом в `r` будет копия `data`, измененная только в соответствующих местах:
`r`, `r.a`, `r.a.b` будут новыми, а `r.c`, `r.c.d` -- в точности тем же, что и в `data`.

`no.jsetter` компилирует jpath в модифицирующую функцию с такой сигнатурой:

```js
setter( data, vars, value )
```

  * `data` — модифицируемый объект
  * `vars` — объект с переменными и функциями (в примере выше не используется, передаем `null`)
  * `value` — новое значение


### Предикаты

```js
data = {
    item: [
        { id: '1', count: 4 },
        { id: '2', count: 8 },
        { id: '3', count: 2 },
    ],
}

//  item'у с id равным '2' поменять count на 7
no.jsetter( '.item{ .id === id }.count' )( data, { id: '2' }, 7 )
```

Если мы не знаем новое значение, но хотим вычислить его из предыдущего значения,
то можно передать вместо нового значения функцию:

```js
//  Увелить на 1 поле count у item'а с id равным '2'
no.jsetter( '.item{ .id === id }.count' )( data, { id: '2' }, count => count + 1 )
```

Более сложный пример:

```js
data = {
    chat: [
        { chat_id: '1', messages: [
            { message_id: '100', ..., status: 'sending' },
            ...
        ] },
        ...
    ],
}

//  Найти чат с нужным id, в нем список сообщений, в нем сообщение с нужным id и
//  поменять ему статус на 'sent'.
no.jsetter( '.chat{ .chat_id === chat_id }.messages{ .message_id === message_id }.status' )( data, {
    chat_id: '....',
    message_id: '....',
}, 'sent' )
```


### Индексы

```js
data = {
    item: [
        { id: '1' },
        { id: '2' },
        { id: '3' },
    ],
}

//  "Выделить" второй item
no.jsetter( '.item[ index ].selected' )( data, { index: 1 }, true )

//  Инвертировать поле selected у последнего item'а
no.jsetter( '.item[ length( . ) - 1 ].selected' )( data, null, value => !value )

//  Явно заменить один item на другой.
no.jsetter( '.item[ 0 ]' )( data, null, { id: '1', selected: true } )

## `no.jsetter.delete`
```

Помимо изменений элементов массива и свойств объекта, бывают нужны и другие операции.
Например, удаление чего-либо (из массива или объекта).

```js
data = {
    foo: {
        bar: 42,
        quu: 24,
    }
}

//  Удалить data.foo.bar
no.jsetter.delete( '.foo.bar' )( data )

data = {
    item: [
        { id: '1', count: 3 },
        { id: '2', count: 7 },
        { id: '3', count: 5 },
    ],
}

//  Удалить первый item
no.jsetter.delete( '.item[ 0 ]' )( data )

//  Удалить item с заданным индексом
no.jsetter.delete( '.item[ index ]' )( data, { index: 1 } )

//  Удалить все item'ы с count > 3.
no.jsetter.delete( '.item{ .count > 3 }' )( data )
``


## `no.jsetter.push`, `no.jsetter.pop`, ...

Плюс часто нужно сделать что-то с массивом. Добавить в него элементов, удалить, отсортировать.
Есть такие методы:

  * `no.jsetter.push`
  * `no.jsetter.pop`
  * `no.jsetter.shift`
  * `no.jsetter.unshift`
  * `no.jsetter.splice`
  * `no.jsetter.sort`

```js
data = {
    item: [
        { id: '1', count: 3 },
        { id: '2', count: 7 },
        { id: '3', count: 5 },
    ],
}

//  Добавить два новых item'а
no.jsetter.push( '.item' )( data, null, { id: '4', count: 0 }, { id: '5', count: 0 } )

//  Удалить второй item и вставить на его места новый item.
no.jsetter.splice( '.item' )( data, null, 1, 1, { id: '4' } )

//  Отсортировать массив
no.jsetter.sort( '.item' )( data, null, ( a, b ) => a.count - b.count )
```

