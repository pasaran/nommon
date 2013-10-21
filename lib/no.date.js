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

data.strpad = function(s, n) {
    var l = n - s.toString().length;

    switch (l) {
        case 0:
            return s;
        case 1:
            return '0' + s;
        case 2:
            return '00' + s;
        case 3:
            return '000' + s;
        default:
            //  FIXME: Нужен String.prototype.repeat.
            return '0'.repeat(l) + s;
    }
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

    var parts = format.split( /%([a-zA-Z])/ );
    for (var i = 0, l = parts.length; i < l; i++) {
        var part = parts[i]

        if (i % 2) {
            switch (part) {
                case 'H':
                    js.push( 'strpad( d.getHours(), 2 )' );
                    break;

                case 'M':
                    js.push( 'strpad( d.getMinutes(), 2 )' );
                    break;

                case 'S':
                    js.push( 'strpad( d.getSeconds(), 2 )' );
                    break;

                case 'f':
                    js.push( 'strpad( d.getTime() % 1000, 3 )' );
                    break;

                case 'Y':
                    js.push( 'd.getFullYear()' );
                    break;

                case 'y':
                    js.push( 'strpad( d.getFullYear() % 100 )' );
                    break;

                case 'd':
                    js.push( 'strpad( d.getDate(), 2 )' );
                    break;

                case 'm':
                    js.push( 'strpad( d.getMonth() + 1, 2 )' );
                    break;

                case 'b':
                    js.push( 'months_abbr[ d.getMonth() ]' );
                    break;

                case 'B':
                    js.push( 'months[ d.getMonth() ]' );
                    break;

                case 'a':
                    js.push( 'days_abbr[ d.getDay() ]' );
                    break;

                case 'A':
                    js.push( 'days[ d.getDay() ]' );
                    break;

                case 's':
                    js.push( 'd.getTime()' );
                    break;
            }
        } else {
            js.push( JSON.stringify(part) );
        }
    }

    return ( new Function('data',
        'var strpad = data.strpad,' +
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

