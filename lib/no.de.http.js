var no = require('./no.js');

require('./no.promise.js');

require('./no.de.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var url_ = require('url');
var http_ = require('http');

//  ---------------------------------------------------------------------------------------------------------------  //

no.de.http = {};

// ----------------------------------------------------------------------------------------------------------------- //

var errorMessages = {
    '400': 'Bad Request',
    '403': 'Forbidden',
    '404': 'Not Found',
    '500': 'Internal Server Error',
    '503': 'Service Unavailable'
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.de.http.get = function(url, params) {
    var options = url_.parse(url, true, true);

    if (params) {
        no.extend(options.query, params);
    }

    var req;
    var promise = new no.Promise();

    promise.on('abort', function() {
        if (req) {
            req.abort();
            req = null;
        }
    })

    getHttp(options, 0);

    return promise;

    function getHttp(options, count) {
        var data = [];
        var length = 0;

        req = http_.request(options, function(res) {
            req = null;

            var status = res.statusCode;

            var error;
            switch (status) {
                //  TODO: Кэшировать 301 запросы.
                case 301:
                case 302:
                    if (count > 3) { // FIXME: MAX_REDIRECTS.
                        return promise.reject({
                            'id': 'HTTP_TOO_MANY_REDIRECTS'
                        });
                    }

                    var location = res.headers['location'] || '';
                    location = url_.resolve(options.href, location);
                    options = url_.parse(location, true, true);

                    return getHttp(options, count + 1);

                case 400:
                case 403:
                case 404:
                case 500:
                case 503:
                    return promise.resolve({
                        'id': 'HTTP_' + status,
                        'message': errorMessages[status]
                    });
            }

            res.on('data', function(chunk) {
                data.push(chunk);
                length += chunk.length;
            });
            res.on('end', function() {
                req = null;
                promise.resolve( Buffer.concat(data, length) );
            });
            res.on('close', function(error) {
                req = null;
                promise.reject({
                    'id': 'HTTP_CONNECTION_CLOSED',
                    'message': error.message
                });
            });
        });

        req.on('error', function(error) {
            req = null;
            promise.reject({
                'id': 'HTTP_UNKNOWN_ERROR',
                'message': error.message
            });
        });

        req.end();
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

