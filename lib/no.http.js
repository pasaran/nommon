var no = require('./no.js');

require('./no.promise.js');

var url_ = require('url');
var http_ = require('http');

//  ---------------------------------------------------------------------------------------------------------------  //

no.http = {};

// ----------------------------------------------------------------------------------------------------------------- //

var errorMessages = {
    '400': 'Bad Request',
    '403': 'Forbidden',
    '404': 'Not Found',
    '500': 'Internal Server Error',
    '503': 'Service Unavailable'
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.http.get = function(url, params) {
    var options = url_.parse(url, true);

    if (params) {
        no.extend(options.query, params);
    }

    var promise = new no.Promise();

    getHttp(options, promise, 0);

    return promise;
};

function getHttp(options, promise, count) {
    console.error(options, count);
    var data = [];

    var req = http_.request( options, function(res) {
        var status = res.statusCode;

        var error;
        switch (status) {
            //  FIXME: Кэшировать 301 запросы.
            case 301:
            case 302:
                if (count > 3) { // FIXME: MAX_REDIRECTS.
                    return promise.reject({
                        'id': 'HTTP_TOO_MANY_REDIRECTS'
                    });
                }

                var location = res.headers['location'];
                //  FIXME: Что делать, если location пустой?

                var redirect = url_.resolve(options.href, location);
                console.error('redirect', redirect);
                return getHttp(redirect, promise, count + 1);

            case 400:
            case 403:
            case 404:
            case 500:
            case 503:
                error = {
                    'id': 'HTTP_' + status,
                    'message': errorMessages[status]
                };
                break;

            //  TODO: default:
        }

        if (error) {
            promise.reject(error);

        } else {
            res.on('data', function(chunk) {
                data.push(chunk);
            });
            res.on('end', function() {
                promise.resolve(data);
            });
            res.on('close', function(error) {
                promise.reject({
                    'id': 'HTTP_CONNECTION_CLOSED',
                    'message': error.message
                });
            });

        }
    } );

    req.on('error', function(error) {
        promise.reject({
            'id': 'HTTP_UNKNOWN_ERROR',
            'message': error.message
        });
    });

    req.end();
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

//  ---------------------------------------------------------------------------------------------------------------  //

