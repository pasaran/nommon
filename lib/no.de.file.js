var no = require('./no.js');

require('./no.events.js');
require('./no.promise.js');

require('./no.de.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var fs_ = require('fs');

//  ---------------------------------------------------------------------------------------------------------------  //

no.de.file = {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Кэш с уже считанными файлами (или файлы, которые в процессе чтения). В кэше хранятся promise'ы.
var _cacheGet = {};

//  Кэш считанных и выполненных файлов. В кэше хранятся promise'ы.
var _cacheLoad = {};

//  За какими файлами мы уже следим (чтобы не делать повторный watch).
var _watched = {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Возможно, нужно сделать флаг dontWatch.
//  Или же не следить за файлом по-дефолту.
no.de.file.get = function(filename) {
    var promise = _cacheGet[filename];

    if (!promise) {
        promise = _cacheGet[filename] = new no.Promise();

        fs_.readFile(filename, function(error, content) {
            if (error) {
                //  Если не удалось считать файл, в следующий раз нужно повторить попытку,
                //  а не брать из кэша ошибку.
                _cacheGet[filename] = null;

                promise.reject({
                    'id': 'FILE_OPEN_ERROR',
                    'message': error.message
                });
            } else {
                //  Содержимое файла закэшировано внутри promise'а. Следим, не изменился ли файл.
                no.de.file.watch(filename);

                promise.resolve(content);
            }

        });
    }

    return promise;
};

no.events.on('file-changed', function(e, filename) {
    //  Файл изменился, выкидываем его из кэша.
    _cacheGet[filename] = null;
});

//  ---------------------------------------------------------------------------------------------------------------  //

no.de.file.load = function(filename) {
    var promise = _cacheLoad[filename];

    if (!promise) {
        promise = _cacheLoad[filename] = new no.Promise();

        no.de.file.get(filename)
            .then(function(content) {
                var result;

                try {
                    result = no.de.eval(content);
                } catch (e) {
                    promise.reject({
                        id: 'EVAL_ERROR',
                        message: e.message
                    });
                }

                no.de.file.watch(filename, 'loaded-file-changed');

                promise.resolve(result);
            })
            .else_(function(error) {
                _cacheLoad[filename] = null;

                promise.reject(error);
            });
    }

    return promise;
};

no.events.on('loaded-file-changed', function(e, filename) {
    //  Файл изменился, выкидываем его из кэша.
    _cacheLoad[filename] = null;
});

//  ---------------------------------------------------------------------------------------------------------------  //

no.de.file.watch = function(filename, type) {
    //  FIXME: Непонятно, как это будет жить, когда файлов будет много.
    if ( !_watched[filename] ) {
        _watched[filename] = true;

        fs_.watchFile(filename, function (curr, prev) {
            if ( prev.mtime.getTime() !== curr.mtime.getTime() ) {
                no.events.trigger(type || 'file-changed', filename);
            }
        });
    }
};

//  NOTE: Если сделать просто no.de.file.get(filename) и не вызвать no.file.de.unwatch(filename),
//  то процесс не завершится никогда. Так как будет висеть слушатель изменений файла.
//
no.de.file.unwatch = function(filename) {
    if (filename) {
        fs_.unwatchFile(filename);

        //  FIXME: Или лучше удалять ключ совсем?
        _watched[filename] = false;
    } else {
        for (var filename in _watched) {
            fs_.unwatchFile(filename);
        }

        _watched = {};
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

