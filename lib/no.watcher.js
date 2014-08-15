var no = no || require('./no.base.js');

if ( no.de ) {
    require('./no.array.js');
    require('./no.events.js');
    require('./no.jpath.js');

    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

( function() {

var _exprs = {};
var _values = {};
var _deps = {};
var _redeps = {};

//  ---------------------------------------------------------------------------------------------------------------  //

no.watcher = {};

//  Варианты применения:
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
//      no.watcher.add( 'foo', 42 );
//      no.watcher.add( 'bar', 24 );
//      no.watcher.add( 'quu', 'foo + bar' );
//
no.watcher.add = function( name, watcher ) {
    var expr = watcher.expr;
    if ( expr ) {
        //  Задано выражение, позволяющее вычислять значение watcher'а.
        //
        if ( typeof expr === 'string' ) {
            //  Строка -- это jpath, в котором значение других watcher'ов
            //  могут фигурировать как jpath-переменные.
            //
            var compiled = no.jpath.expr( expr );

            expr = _exprs[ name ] = function( values ) {
                //  В скомпилированный jpath первым параметром передаются данные,
                //  а вторым -- переменные. Данных у нас быть не может, так что `null`.
                //
                return compiled( null, values );
            };

        } else {
            //  Тут должна быть функция.
            _exprs[ name ] = expr;
        }
    }

    //  Выставляем начальное значение.
    //
    var value = watcher.value;
    if ( value !== undefined ) {
        //  Задано в определении.
        _values[ name ] = value;

    } else if ( expr ) {
        //  Не задано, но можно вычислить.
        _values[ name ] = expr( _values );

    } else {
        //  Что-то одно должно быть задано. Или значение, или как его вычислить.
        throw Error( 'expr or value should be defined' );
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
            //  FIXME: Использовать потом `no.error`.
            throw Error( 'Watcher ' + dep + ' undefined' );
        }
        deps = deps.concat( _deps[ dep ] );
    }
    //  И оставляем только уникальные.
    deps = _deps[ name ] = no.array.uniq( deps );
    //
    //  Теперь строим обратные зависимости.
    //  Т.е. какие элементы нужно пересчитать, если изменился этот элемент.
    //
    for ( var i = 0, l = deps.length; i < l; i++ ) {
        var dep = deps[ i ];
        _redeps[ dep ].push( name );
    }
    //  Свежедобавленный элемент не может ни на кого влиять.
    _redeps[ name ] = [];
};

no.extend( no.watcher, no.Events );

//  ---------------------------------------------------------------------------------------------------------------  //

no.watcher.get = function( name, force, silent ) {
    var value = _values[ name ];

    if ( force ) {
        var expr = _exprs[ name ];
        if ( expr ) {
            value = expr( _values );

            no.watcher.set( name, value, silent );
        }
    }

    return value;
};

no.watcher.set = function( name, value, silent ) {
    var changes = {};
    set( name, value, changes );

    if ( !silent ) {
        for ( var name in changes ) {
            no.watcher.trigger( 'change:' + name, changes[ name ] );
        }
        no.watcher.trigger( 'change', changes );
    }
};

function set( name, value, changes ) {
    var change = set_one( name, value );

    if ( change ) {
        changes[ name ] = change;

        rebuild( name, changes );
    }
}

function set_one( name, value ) {
    var old_value = _values[ name ];
    _values[ name ] = value;

    if ( value !== old_value ) {
        return {
            value: value,
            old_value: old_value
        };
    }
};

function rebuild( name, changes ) {
    var redeps = _redeps[ name ];

    for ( var i = 0, l = redeps.length; i < l; i++ ) {
        var redep = redeps[ i ];

        var expr = _exprs[ redep ];
        if ( expr ) {
            var value = expr( _values );

            var change = set_one( redep, value );
            if ( change ) {
                changes[ redep ] = change;
            }
        }
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

} )();

