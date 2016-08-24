# Changelog

## 0.0.43

  * При генерации тернарного оператора, оборачиваем его целиком в `( ... )`.

## 0.0.42

  * BREAKING. Для браузера нужно использовать сборку через browserify. Например:

        //  test.js
        var no = require('nommon/lib/no.jpath.js');

        var foobar = no.jpath( '.foo.bar', { foo: { bar: 42 } } );
        console.log( foobar );

    Сборка:

        browserify test.js > _test.js

## 0.0.41

  * [no.jpath] Пофикшены внешние функции. Например:

        no.jpath.defunc( 'upper_case', function( x ) {
            return ( x || '' ).toUpperCase();
        } );

        var result = no.jpath.string( 'hello-{ upper_case( .hello ) } );

## 0.0.40

  * [no.jpath] Обнаружен и частично пофикшен баг #30.

## 0.0.39

  * [no.jpath] Тернарный оператор.

## 0.0.38

  * Фикс в `no.number.format`. Проверяем, что передали число.

## 0.0.37

  * В `lib/index.js` добавлен забытый `require( './no.number.js' );`.

## 0.0.36

  * `no.string.group_sep`.
  * `no.number.format`.

## 0.0.35

  * Немного локализации в `no.date.js`.

## 0.0.34

  * В `package.json` забыт файл `lib/no.js`.

## 0.0.33

  * **Важно!** Смена движка `jpath`-ов.

    Скорее всего, у вас все сломается.
    Не двигайте версию выше `0.0.32`, если вы не знаете точно, что делаете.

## 0.0.32

  * Методы `no.array.uniq`, `no.array.union`.
  * `no.Watcher`.

## 0.0.31

  * Метод `no.object.is_empty()`.

## 0.0.30

  * Вернулся в строй модуль `no.future.js`.

## 0.0.29

  * `no.promise` может принимать теперь объект (а не только массив).

## 0.0.28

  * Не используем больше нигде `instanceof Array` т.к. это не работет в файлах,
    исполняемых через разные виды eval'а.

  * [shims/string] Не трогаем прототип, все уносим в `no.string.*`.
    При eval'е файлов, очень трудно добиться, чтобы в них работали методы из, например, `String.prototype`.

## 0.0.27

  * [shims/string] `String.prototype.repeat` и `String.prototype.padLeft`.
  * [no.date] Подключаем `shims/string.js`.

## 0.0.26

  * [no.date] Формат `%f` для того, чтобы выводить секунды с точностью до одной тысячной.

## 0.0.25

  * [no.date] Простой форматер дат.

## 0.0.24

  * [no.jpath] "Внешние" функции а-ля `yate`:

        no.jpath.expr(
            '"http://yandex.ru/yandsearch?text={ encode(.text) }"',
            //  Variables
            null,
            // Functions
            {
                encode: function(s) {
                    return encodeURIComponent(s)
                }
            }
        )

    Подробности и дальнейшая дискуссия: [https://github.com/pasaran/nommon/issues/18](https://github.com/pasaran/nommon/issues/18).

  * [no.jpath] Short-circuit evaluation для `&&` и `||`.
    Т.е. теперь `.foo || 42` вычислится в 42, если `.foo` ложно, а не в `true`.

