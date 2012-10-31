var no;
if (typeof window === 'undefined') {
    no = require('./no.js');
} else {
    no = no || {};
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  Простейший pub/sub
//  ------------------
//
//  `no.Events` -- объект, который можно подмиксовать к любому другому объекту:
//
//      var foo = {};
//      no.extend(foo, no.Events);
//
//      foo.on('bar', function(e, data) {
//          console.log(e, data);
//      });
//
//      foo.trigger('bar', 42);
//
//  Или же:
//
//      function Foo() {}
//
//      no.extend(Foo.prototype, no.Events);
//
//      var foo = new Foo();
//
//      foo.on('bar', function(e, data) {
//          console.log(e, data);
//      });
//
//      foo.trigger('bar', 42);
//

//  ---------------------------------------------------------------------------------------------------------------  //

no.Events = {};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Events._noevents_init = function() {
    if (!this._noevents_handlers) {
        this._noevents_handlers = {};
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Возвращает список обработчиков события name.
//  Если еще ни одного обработчика не забинжено, возвращает (и сохраняет) пустой список.
//
no.Events._noevents_get = function(name) {
    this._noevents_init();

    var handlers = this._noevents_handlers;

    return handlers[name] || (( handlers[name] = [] ));
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Подписываем обработчик handler на событие name.
//
no.Events.on = function(name, handler) {
    this._noevents_get(name).push(handler);
};

//  Отписываем обработчик handler от события name.
//  Если не передать handler, то удалятся вообще все обработчики события name.
//
no.Events.off = function(name, handler) {
    if (handler) {
        var handlers = this._noevents_get(name);
        //  Ищем этот хэндлер среди уже забинженных обработчиков этого события.
        var i = handlers.indexOf(handler);

        if (i !== -1) {
            //  Нашли и удаляем этот обработчик.
            handlers.splice(i, 1);
        }
    } else {
        var handlers = this._noevents_handlers;
        if (handlers) {
            //  Удаляем всех обработчиков этого события.
            //  FIXME: Может тут лучше делать handlers[name] = null?
            delete handlers[name];
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  "Генерим" событие name. Т.е. вызываем по-очереди (в порядке подписки) все обработчики события name.
//  В каждый передаем name и params.
//
no.Events.trigger = function(name, params) {
    //  Копируем список хэндлеров.
    //  Если вдруг внутри какого-то обработчика будет вызван `off()`,
    //  то мы не потеряем вызов следующего обработчика.
    var handlers = this._noevents_get(name).slice();

    for (var i = 0, l = handlers.length; i < l; i++) {
        handlers[i].call(this, name, params);
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  "Форвардим" все сообщения name в другой объект.
//
no.Events.forward = function(name, object) {
    this.on(name, function(e, params) {
        object.trigger(e, params);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.events = no.extend( {}, no.Events );

//  ---------------------------------------------------------------------------------------------------------------  //

