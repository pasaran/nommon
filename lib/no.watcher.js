var no = require( './no.js' );

if ( no.de ) {
    require( './no.array.js' );
    require( './no.object.js' );
    require( './no.events.js' );
    require( './no.jpath.js' );

    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  Варианты применения:
//
//      var watcher = new no.Watcher();
//
//      watcher.on( 'change', function( e, params ) {
//          console.log( params );
//      } );
//
//      no.watcher.add( 'selected_count', {
//          value: 0
//      } );
//      no.watcher.add( 'selected', {
//          expr: function( values ) {
//              return ( values.selected_count > 0 );
//          },
//          deps: [ 'selected_count' ]
//      } );
//      //
//      //  или
//      //
//      no.watcher.add( 'selected', {
//          expr: 'selected_count > 0',
//          deps: 'selected_count'
//      } );
//
//
//      no.watcher.get( 'selected' ); // false
//      no.watcher.on( 'change:selected', function( e, params ) {
//          console.log( params );
//      } );
//      no.watcher.set( 'selected_count', 42 );
//
//      no.watcher.add( 'foo', { value: 42 } );
//      no.watcher.add( 'bar', { value: 24 } );
//      no.watcher.add( 'quu', {
//          expr: 'foo + bar',
//          deps: [ 'foo', 'bar' ]
//      } );
//      no.watcher.set( {
//          foo: 33,
//          bar: 44
//      } );
//

//  ---------------------------------------------------------------------------------------------------------------  //

no.Watcher = function() {
    this._exprs = {};
    this._values = {};
    this._deps = {};
    this._redeps = {};
};

no.extend( no.Watcher.prototype, no.Events );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Watcher.prototype.add = function( name, watcher ) {
    var expr = watcher.expr;
    if ( expr ) {
        //  Задано выражение, позволяющее вычислять значение watcher'а.
        //
        if ( typeof expr === 'string' ) {
            //  Строка -- это jpath, в котором значение других watcher'ов
            //  могут фигурировать как jpath-переменные.
            //
            var compiled = no.jpath.expr( expr );

            expr = this._exprs[ name ] = function( values ) {
                //  В скомпилированный jpath первым параметром передаются данные,
                //  а вторым -- переменные. Данных у нас быть не может, так что `null`.
                //
                return compiled( null, null, values );
            };

        } else {
            //  Тут должна быть функция.
            this._exprs[ name ] = expr;
        }
    }

    //  Выставляем начальное значение.
    //
    if ( expr ) {
        //  Вычисляем значение, если знаем как.
        this._values[ name ] = expr( this._values );

    } else if ( watcher.value !== undefined ) {
        //  Значение задано в определении.
        this._values[ name ] = watcher.value;

    } else {
        //  Что-то одно должно быть задано. Или значение, или как его вычислить.
        no.throw( 'expr or value should be defined' );
    }

    //  Нормализуем зависимости. Прямые и обратные.
    //
    var deps = no.array( watcher.deps );
    //
    //  Для каждого элемента в `watcher.deps`
    //  берем его уже нормализованные зависимости.
    //
    for ( var i = 0, l = deps.length; i < l; i++ ) {
        var dep = deps[ i ];
        if ( !dep ) {
            no.throw( 'Watcher "%name" undefined', { name: dep } );
        }
        deps = deps.concat( this._deps[ dep ] );
    }
    //  И оставляем только уникальные.
    deps = this._deps[ name ] = no.array.uniq( deps );
    //
    //  Теперь строим обратные зависимости.
    //  Т.е. какие элементы нужно пересчитать, если изменился этот элемент.
    //
    for ( var i = 0, l = deps.length; i < l; i++ ) {
        var dep = deps[ i ];
        this._redeps[ dep ].push( name );
    }
    //  Свежедобавленный элемент не может ни на кого влиять.
    this._redeps[ name ] = [];
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Watcher.prototype.get = function( name, force, silent ) {
    var value = this._values[ name ];

    if ( force ) {
        var expr = this._exprs[ name ];
        if ( expr ) {
            value = expr( this._values );

            no.watcher.set( name, value, silent );
        }
    }

    return value;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Можно ли менять значение переменной, которая от чего-то зависит?
//  Или же она всегда должна явно вычисляться из своих зависимостей?

//  FIXME: Может таки сделать параметр `options` вида `{ silent: true }`
//  вместо нечитаемого просто `true`?

//  Примеры использования:
//
//      no.watcher.set( 'a', 42 );
//      //  Silence!
//      no.watcher.set( 'a', 42, true );
//
//      no.watcher.set( {
//          a: 42,
//          b: 24
//      } );
//      //  Silence!
//      no.watcher.set( {
//          a: 42,
//          b: 24
//      }, true );
//
no.Watcher.prototype.set = function( name, value, silent ) {
    var changes = {};

    if ( typeof name === 'object' ) {
        //  В `name` объект с изменениями, а в `value` флаг `silent`.
        var values = name;
        silent = value;

        var _redeps = this._redeps;

        //  Строим список зависимостей всех изменившихся свойств.
        var redeps = [];
        for ( var name in values ) {
            var change = this._set( name, values[ name ] );
            if ( change ) {
                changes[ name ] = change;

                redeps = redeps.concat( _redeps[ name ] );
            }
        }
        //  Оставляем только уникальные зависимости.
        redeps = no.array.uniq( redeps );
        //  Пересчитываем все зависимости.
        this._rebuild( redeps, changes );

    } else {
        var change = this._set( name, value );
        if ( change ) {
            changes[ name ] = change;

            var redeps = this._redeps[ name ];
            //  Пересчитываем зависимости.
            this._rebuild( redeps, changes );
        }
    }

    //  Если были изменения и режим не `silent`,
    //  генерим события:
    //
    //    * По одному событию `change:foo` на каждое изменившееся свойство `foo`,
    //      при этом в `params` приходит объект с изменениями вида:
    //
    //          {
    //              value: 42,
    //              old_value: 24
    //          }
    //
    //    * Одно общее событие `change` с параметрами вида:
    //
    //          {
    //              foo: {
    //                  value: 42,
    //                  old_value: 24
    //              },
    //              ...
    //          }
    //
    if ( !silent && !no.object.is_empty( changes ) ) {
        for ( var name in changes ) {
            this.trigger( 'change:' + name, changes[ name ] );
        }
        this.trigger( 'change', changes );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Watcher.prototype._set = function( name, value ) {
    var _values = this._values;

    var old_value = _values[ name ];
    _values[ name ] = value;

    if ( value !== old_value ) {
        //  Если значение на самом деле изменилось,
        //  возвращаем объект, описывающий изменения.
        //
        return {
            value: value,
            old_value: old_value
        };
    }
};

no.Watcher.prototype._rebuild = function( redeps, changes ) {
    var _exprs = this._exprs;
    var _values = this._values;

    for ( var i = 0, l = redeps.length; i < l; i++ ) {
        var redep = redeps[ i ];

        var expr = _exprs[ redep ];
        if ( expr ) {
            var value = expr( _values );

            var change = this._set( redep, value );
            if ( change ) {
                changes[ redep ] = change;
            }
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

