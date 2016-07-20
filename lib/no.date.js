var no = require( './no.base.js' );

require( './no.string.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

no.date = {};

//  ---------------------------------------------------------------------------------------------------------------  //

no.date.i18n = {};

no.date.i18n.en = {
    A: [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ],
    a: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
    B: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
    b: [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]
};
//  В английской локали %b и %h — это одно и то же.
no.date.i18n.en.h = no.date.i18n.en.b;

no.date.i18n.ru = {
    A: [ 'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота' ],
    a: [ 'Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб' ],
    B: [ 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь' ],
    b: [ 'Янв.', 'Февр.', 'Март', 'Апр.', 'Май', 'Июнь', 'Июль', 'Авг.', 'Сент.', 'Окт.', 'Нояб.', 'Дек.' ],
    h: [ 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря' ]
};

//  ---------------------------------------------------------------------------------------------------------------  //

var _formatters = {};

no.date.format = function( format, date, locale ) {
    locale = locale || 'en';

    var key = format + '$' + locale;
    var formatter = _formatters[ key ];
    if ( !formatter ) {
        formatter = _formatters[ key ] = no.date.formatter( format, locale );
    }

    return formatter( date );
};

no.date.formatter = function( format, locale ) {
    var i18n = no.date.i18n[ locale ] || no.date.i18n.en;

    var js = [];

    var parts = format.split( /%([a-zA-Z%])/ );
    for ( var i = 0, l = parts.length; i < l; i++ ) {
        var part = parts[ i ];

        if ( i % 2 ) {
            switch ( part ) {
                //  http://php.net/manual/en/function.strftime.php

                //  Day.

                case 'a':
                    js.push( 'a[d.getDay()]' );
                    break;

                case 'A':
                    js.push( 'A[d.getDay()]' );
                    break;

                case 'd':
                    js.push( 'p(d.getDate(),2,"0")' );
                    break;

                case 'e':
                case 'j':
                case 'u':
                case 'w':
                    break;

                //  Week.

                case 'U':
                case 'V':
                case 'W':
                    break;

                //  Month.

                case 'b':
                    js.push( 'b[d.getMonth()]' );
                    break;

                case 'h':
                    js.push( 'h[d.getMonth()]' );
                    break;

                case 'B':
                    js.push( 'B[d.getMonth()]' );
                    break;

                case 'm':
                    js.push( 'p(d.getMonth()+1,2,"0")' );
                    break;

                //  Year.

                case 'y':
                    js.push( 'p(d.getFullYear()%100)' );
                    break;

                case 'Y':
                    js.push( 'd.getFullYear()' );
                    break;

                case 'C':
                case 'g':
                case 'G':
                    break;

                //  Time.

                case 'H':
                    js.push( 'p(d.getHours(),2,"0")' );
                    break;

                case 'M':
                    js.push( 'p(d.getMinutes(),2,"0")' );
                    break;

                case 'S':
                    js.push( 'p(d.getSeconds(),2,"0")' );
                    break;

                case 'k':
                case 'I':
                case 'l':
                case 'p':
                case 'P':
                case 'r':
                case 'R':
                case 'T':
                case 'X':
                case 'z':
                case 'Z':
                    break;

                //  Time and Date Stamps.

                case 's':
                    js.push( 'd.getTime()' );
                    break;

                case 'c':
                case 'D':
                case 'F':
                case 'x':
                    break;

                //  Miscellaneous.
                case '%':
                    js.push( '"%"' );
                    break;

                case 'n':
                    js.push( '"\\n"' );
                    break;

                case 't':
                    js.push( '"\\t"' );
                    break;

                //  Non-standard.

                case 'f':
                    js.push( 'p(d.getTime()%1000,3,"0")' );
                    break;

            }

        } else {
            js.push( JSON.stringify( part ) );
        }
    }

    return ( new Function( 'i18n', 'no',
        'var p = no.string.pad_left,' +
        'a = i18n.a,' +
        'A = i18n.A,' +
        'b = i18n.b,' +
        'B = i18n.B,' +
        'h = i18n.h;' +
        'return function(d) {return ' + js.join( '+' ) + '};'
    ) )( i18n, no );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

