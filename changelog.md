# Changelog

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

