var no = no || require('./no.base.js');

if ( no.de ) {
    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.date = {};

//  ---------------------------------------------------------------------------------------------------------------  //

(function() {

//  TODO: Локализация!
//
var inline_js =
    'var days = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];' +
    'var days_abbr = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];' +
    'var months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];' +
    'var months_abbr = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];' +
    'function pad(n) {' +
        'return (n < 10) ? "0" + n : n;' +
    '}';

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
                    js.push( 'pad( d.getHours(), 2 )' );
                    break;

                case 'M':
                    js.push( 'pad( d.getMinutes(), 2 )' );
                    break;

                case 'S':
                    js.push( 'pad( d.getSeconds(), 2 )' );
                    break;

                case 'Y':
                    js.push( 'd.getFullYear()' );
                    break;

                case 'y':
                    js.push( 'pad( d.getFullYear() % 100 )' );
                    break;

                case 'd':
                    js.push( 'pad( d.getDate(), 2 )' );
                    break;

                case 'm':
                    js.push( 'pad( d.getMonth() + 1, 2 )' );
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

    return ( new Function(inline_js + 'return function(d) { return ' + js.join('+') + '; };') )();
};

//  ---------------------------------------------------------------------------------------------------------------  //

})();

//  ---------------------------------------------------------------------------------------------------------------  //

