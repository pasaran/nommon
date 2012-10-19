var no = require('./no.js');

require('./no.events.js');
require('./no.promise.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var fs_ = require('fs');

//  ---------------------------------------------------------------------------------------------------------------  //

no.file = {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Кэш с уже считанными файлами (или файлы, которые в процессе чтения). В кэше хранятся promise'ы.
var _cache = {};

//  За какими файлами мы уже следим (чтобы не делать повторный watch).
var _watched = {};

//  ---------------------------------------------------------------------------------------------------------------  //

no.file.get = function(filename) {
    var promise = _cache[filename];

    if (!promise) {
        promise = _cache[filename] = new no.Promise();

        fs_.readFile(filename, function(error, content) {
            if (error) {
                //  Если не удалось считать файл, в следующий раз нужно повторить попытку,
                //  а не брать из кэша ошибку.
                delete _cache[filename];

                promise.reject({
                    'id': 'FILE_OPEN_ERROR',
                    'message': error.message
                });
            } else {
                //  Содержимое файла закэшировано внутри promise'а. Следим, не изменился ли файл.
                no.file.watch(filename);
                promise.resolve(content);
            }

        });
    }

    return promise;
};

no.events.on('file-changed', function(e, filename) {
    //  Файл изменился, выкидываем его из кэша.
    delete _cache[filename];

    // FIXME: Не нужно ли тут делать еще и unwatch?
});

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Что произойдет, если нодовский процесс завершится,
//  но явно никто не вызовет unwatch?
//
no.file.watch = function(filename) {
    //  FIXME: Непонятно, как это будет жить, когда файлов будет много.
    if ( !_watched[filename] ) {
        _watched[filename] = true;

        fs_.watchFile(filename, function (curr, prev) {
            if ( prev.mtime.getTime() !== curr.mtime.getTime() ) {
                no.events.trigger('file-changed', filename);
            }
        });
    }
};

//  NOTE: Если сделать просто no.file.get(filename) и не вызвать no.file.unwatch(filename),
//  то процесс не завершится никогда. Так как будет висеть слушатель изменений файла.
//
no.file.unwatch = function(filename) {
    if (filename) {
        fs_.unwatchFile(filename);
    } else {
        for (var filename in _watched) {
            fs_.unwatchFile(filename);
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

//  ---------------------------------------------------------------------------------------------------------------  //

