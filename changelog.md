# Changelog

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

