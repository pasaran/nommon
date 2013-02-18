var no;
if  (typeof window === 'undefined') {
    no = require('./no.js');
    require('./no.events.js');
} else {
    no = no || {};
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  Объект, обещающий вернуть некий результат в будущем.
//  Обычно результат получается в результате некоторых асинхронных действий.
//
//  В сущности, это аналог обычных callback'ов, но более продвинутый.
//  А точнее, это событие, генерящееся при получении результата и на которое
//  можно подписаться:
//
//      var promise = new no.Promise();
//
//      promise.then(function(result) { // Подписываемся на получение результата.
//          console.log(result); // 42
//      });
//
//      // И где-то дальше:
//      ... promise.resolve(42); // Рассылаем результат всем подписавшимся.
//
//  Можно подписать на результат несколько callback'ов:
//
//      promise.then(function(result) { // Все методы then, else_, resolve, reject и wait -- chainable.
//          // Сделать что-нибудь.
//      }).then(function(result) {
//          // Сделать что-нибудь еще.
//      });
//
//  Можно подписываться на результат даже после того, как он уже получен:
//
//      var promise = new no.Promise();
//      promise.resolve(42);
//
//      promise.then(function(result) { // callback будет выполнен немедленно.
//          console.log(result); // 42
//      });
//
//  Имея список из нескольких promise'ов, можно создать новый promise,
//  которое зарезолвится только после того, как зарезолвятся все promise'ы из списка:
//
//      var p1 = new no.Promise();
//      var p2 = new no.Promise();
//
//      var p = no.Promise.wait([ p1, p2 ]);
//      p.then(function(result) { // В result будет массив из результатов p1 и p2.
//          console.log(result); // [ 42, 24 ]
//      });
//
//      p2.resolve(24); // Порядок, в котором резолвятся promise'ы из списка не важен.
//                      // При это в результате порядок будет тем же, что и promise'ы в wait([ ... ]).
//      p1.resolve(42);
//
//  К методам then/resolve есть парные методы else_/reject для ситуации, когда нужно вернуть
//  не результат, а какую-нибудь ошибку.
//
//      var p1 = new no.Promise();
//      var p2 = new no.Promise();
//
//      var p = no.Promise.wait([ p1, p2 ]);
//      p.else_(function(error) {
//          console.log(error); // 'Foo!'
//      });
//
//      p1.resolve(42);
//      p2.reject('Foo!'); // Если режектится любой promise из списка, p тоже режектится.
//
no.Promise = function() {
    this._nopromise_init();
};

no.extend(no.Promise.prototype, no.Events);

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.prototype._nopromise_init = function() {
    this._nopromise_thens = [];
    this._nopromise_elses = [];
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  NOTE: Да, ниже следует "зловещий копипаст". Методы then/else_ и resolve/reject совпадают почти дословно.
//  Альтернатива в виде прокладки, реализующей только then/resolve (как, например, в jQuery), мне не нравится.


//  Добавляем callback, ожидающий обещанный результат.
//  Если promise уже зарезолвился, callback выполняется немедленно.
//
no.Promise.prototype.then = function(callback) {
    if (!this._nopromise_rejected) {
        if (this._nopromise_resolved) {
            callback(this._nopromise_result);
        } else {
            this._nopromise_thens.push(callback);
        }
    }

    return this;
};

//  Тоже самое, что и then.
//
no.Promise.prototype.else_ = function(callback) {
    if (!this._nopromise_resolved) {
        if (this._nopromise_rejected) {
            callback(this._nopromise_error);
        } else {
            this._nopromise_elses.push(callback);
        }
    }

    return this;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Передать результат всем подписавшимся.
//
no.Promise.prototype.resolve = function(result) {
    if ( !(this._nopromise_resolved || this._nopromise_rejected) ) {
        this._nopromise_resolved = true;
        this._nopromise_result = result;

        var thens = this._nopromise_thens;
        for (var i = 0, l = thens.length; i < l; i++) {
            thens[i](result);
        }
        this._nopromise_thens = this._nopromise_elses = null;
    }

    return this;
};

//  Тоже самое, что и resolve.
//
no.Promise.prototype.reject = function(error) {
    if ( !(this._nopromise_rejected || this._nopromise_resolved) ) {
        this._nopromise_rejected = true;
        this._nopromise_error = error;

        var elses = this._nopromise_elses;
        for (var i = 0, l = elses.length; i < l; i++) {
            elses[i](error);
        }
        this._nopromise_thens = this._nopromise_elses = null;
    }

    return this;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Проксируем resolve/reject в другой promise.
//
no.Promise.prototype.pipe = function(promise) {
    this.then(function(result) {
        promise.resolve(result);
    });
    this.else_(function(error) {
        promise.reject(error);
    });

    return this;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Создаем из массива promise'ов новый promise, который зарезолвится только после того,
//  как зарезолвятся все promise'ы из списка. Результатом будет массив результатов.
//
no.Promise.wait = function(promises) {
    var wait = new no.Promise();

    var results = [];
    var l = promises.length;
    var n = l;
    for (var i = 0; i < l; i++) {
        //  Замыкание, чтобы сохранить значения promise и i.
        (function(promise, i) {

            promise.then( function(result) {
                results[i] = result;
                if (!--n) {
                    wait.resolve(results);
                }
            } );

            promise.else_( function(error) {
                //  FIXME: Может тут нужно сделать results = null; ?
                wait.reject(error);
            } );

        })(promises[i], i);

    };

    return wait;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Promise.resolve = function(value) {
    return ( new no.Promise() ).resolve(value);
};

no.Promise.reject = function(value) {
    return ( new no.Promise() ).reject(value);
};

//  ---------------------------------------------------------------------------------------------------------------  //

