var no = require('./no.js');

require('./no.events.js');
require('./no.promise.js');

//  ---------------------------------------------------------------------------------------------------------------  //

no.file = {};

//  ---------------------------------------------------------------------------------------------------------------  //

var _cache = {};
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

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = no;

//  ---------------------------------------------------------------------------------------------------------------  //

