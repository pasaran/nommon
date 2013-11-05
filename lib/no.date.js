var no = no || require('./no.base.js');

if ( no.de ) {
    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.date = {};

//  ---------------------------------------------------------------------------------------------------------------  //

(function() {

//  TODO: Локализация!
var data = {
    days: [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ],
    days_abbr: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
    months: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
    months_abbr: [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]
};

//  ---------------------------------------------------------------------------------------------------------------  //

var _formatters = {}

no.date.format = function(format, date) {
    var formatter = _formatters[format];
    if (!formatter) {
        formatter = _formatters[format] = no.date.formatter(format);
    }

    return formatter(date);
};

no.date.formatter = function(format) {
    var js = [];

    var parts = format.split( /%([a-zA-Z%])/ );
    for (var i = 0, l = parts.length; i < l; i++) {
        var part = parts[i]

        if (i % 2) {
            switch (part) {
                //  http://php.net/manual/en/function.strftime.php

                //  Day.

                case 'a':
                    js.push( 'days_abbr[ d.getDay() ]' );
                    break;

                case 'A':
                    js.push( 'days[ d.getDay() ]' );
                    break;

                case 'd':
                    js.push( 'strpad( d.getDate(), 2, "0" )' );
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
                case 'h':
                    js.push( 'months_abbr[ d.getMonth() ]' );
                    break;

                case 'B':
                    js.push( 'months[ d.getMonth() ]' );
                    break;

                case 'm':
                    js.push( 'strpad( d.getMonth() + 1, 2, "0" )' );
                    break;

                //  Year.

                case 'y':
                    js.push( 'strpad( d.getFullYear() % 100 )' );
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
                    js.push( 'strpad( d.getHours(), 2, "0" )' );
                    break;

                case 'M':
                    js.push( 'strpad( d.getMinutes(), 2, "0" )' );
                    break;

                case 'S':
                    js.push( 'strpad( d.getSeconds(), 2, "0" )' );
                    break;

                case 'k':
                case 'I':
                case 'l':
                case 'p':
                case 'P':
                case 'r':
                case 'R':
                case 'S':
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
                    js.push( 'strpad( d.getTime() % 1000, 3, "0" )' );
                    break;

            }
        } else {
            js.push( JSON.stringify(part) );
        }
    }

    return ( new Function('data',
        'var strpad = String.padLeft,' +
        'days = data.days,' +
        'days_abbr = data.days_abbr,' +
        'months = data.months,' +
        'months_abbr = data.months_abbr;' +
        'return function(d) { return ' + js.join('+') + '; };'
    ) )(data);
};

//  ---------------------------------------------------------------------------------------------------------------  //

})();

//  ---------------------------------------------------------------------------------------------------------------  //

