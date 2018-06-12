function is_scalar( data ) {
    return ( data == null || typeof data !== 'object' );
}

function is_array( data ) {
    return Array.isArray( data );
}

//  ---------------------------------------------------------------------------------------------------------------  //

function s_namestep( data, root, vars, value, step, next ) {
    if ( is_scalar( data ) || Array.isArray( data ) ) {
        return data;
    }

    var old_value = data[ step ];
    var new_value = next( old_value, root, vars, value );
    if ( new_value === old_value ) {
        return data;
    }

    var new_data = Object.assign( {}, data );
    new_data[ step ] = new_value;

    return new_data;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function s_namestep_set( data, value, step ) {
    if ( is_scalar( data ) || Array.isArray( data ) ) {
        return data;
    }

    var old_value = data[ step ];
    var new_value = ( typeof value === 'function' ) ? value( old_value ) : value;
    if ( new_value !== old_value ) {
        var new_data = Object.assign( {}, data );
        new_data[ step ] = new_value;

        return new_data;
    }

    return data;
}

function s_namestep_delete( data, step ) {
    if ( is_scalar( data ) || Array.isArray( data ) ) {
        return data;
    }

    var new_data = Object.assign( {}, data );
    delete new_data[ step ];

    return new_data;
}

function s_array_method( data, method, args ) {
    if ( !is_array( data ) ) {
        return;
    }

    var new_data = data.concat();
    new_data[ method ].apply( new_data, args );

    return new_data;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function s_index( data, root, vars, value, expr, next ) {
    if ( !Array.isArray( data ) ) {
        return data;
    }

    //  FIXME: Нужно ли проверять, что index это
    //      а) целое число
    //      б) не выходит за текущие границы массива
    //
    var index = expr( data, root, vars );

    var old_value = data[ index ];
    var new_value = next( old_value, root, vars, value );

    if ( new_value === old_value ) {
        return data;
    }

    var new_data = data.concat();
    new_data[ index ] = new_value;

    return new_data;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function s_index_set( data, root, vars, value, expr ) {
    //  FIXME: Почему бы не сделать возможность делать так: .foo.bar[ key ] = 42
    //
    if ( !Array.isArray( data ) ) {
        return data;
    }

    var index = expr( data, root, vars );

    var old_value = data[ index ];
    var new_value = ( typeof value === 'function' ) ? value( old_value ) : value;
    if ( new_value === old_value ) {
        return data;
    }

    var new_data = data.concat();
    new_data[ index ] = new_value;

    return new_data;
}

function s_index_delete( data, root, vars, expr ) {
    if ( is_scalar( data ) ) {
        return data;
    }

    var index = expr( data, root, vars );

    if ( is_array( data ) ) {
        if ( Math.floor( index ) === index && index >= 0 && index < data.length ) {
            var new_data = data.concat();
            new_data.splice( index, 1 );

            return new_data;
        }

    } else {
        if ( index in data ) {
            var new_data = Object.assign( {}, data );
            delete new_data[ index ];

            return new_data;
        }
    }

    return data;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function s_predicate( data, root, vars, value, expr, next ) {
    return ( Array.isArray( data ) ) ?
        s_array_predicate( data, root, vars, value, expr, next ) :
        s_other_predicate( data, root, vars, value, expr, next );
}

function s_other_predicate( data, root, vars, value, expr, next ) {
    var passed = expr( data, root, vars );

    return ( passed ) ? next( data, root, vars, value ) : data;
}

function s_array_predicate( data, root, vars, value, expr, next ) {
    var new_data = data.concat();

    var changed = false;
    for ( var i = 0, l = data.length; i < l; i++ ) {
        var old_value = data[ i ];

        var passed = expr( old_value, root, vars );
        if ( passed ) {
            var new_value = next( old_value, root, vars, value );
            if ( new_value !== old_value ) {
                changed = true;

                new_data[ i ] = new_value;
            }
        }
    }

    return ( changed ) ? new_data : data;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function s_predicate_set( data, root, vars, value, expr ) {
    return ( Array.isArray( data ) ) ?
        s_array_predicate_set( data, root, vars, value, expr ) :
        s_other_predicate_set( data, root, vars, value, expr );
}

//  FIXME.
function s_other_predicate_set( data, root, vars, value, expr ) {
    if ( is_scalar( data ) || !expr( data, root, vars ) ) {
        return data;
    }

    //  FIXME: Блабла.
}

function s_array_predicate_set( data, root, vars, value, expr ) {
    var new_data = data.concat();

    var changed = false;
    for ( var i = 0, l = data.length; i < l; i++ ) {
        var old_value = data[ i ];

        var passed = expr( old_value, root, vars );
        if ( passed ) {
            var new_value = ( typeof value === 'function' ) ? value( old_value ) : value;
            if ( new_value !== old_value ) {
                changed = true;

                new_data[ i ] = new_value;
            }
        }
    }

    return ( changed ) ? new_data : data;
}

function s_predicate_delete( data, root, vars, expr ) {
    if ( is_scalar( data ) ) {
        return data;
    }

    if ( is_array( data ) ) {
        var new_data = [];

        var changed = false;
        for ( var i = 0, l = data.length; i < l; i++ ) {
            var item = data[ i ];

            if ( expr( item, root, vars ) ) {
                changed = true;

            } else {
                new_data.push( item );
            }
        }

        if ( changed ) {
            return new_data;
        }

    } else {
        var key = expr( data, root, vars );

        if ( key in data ) {
            var new_data = Object.assign( {}, data );
            delete new_data[ key ];

            return new_data;
        }
    }

    return data;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function g_namestep( data, name ) {
    return ( Array.isArray( data ) ) ?
        g_array_namestep( data, name, [] ) :
        data[ name ];
}

function g_array_namestep( data, name, result ) {
    for ( var i = 0, l = data.length; i < l; i++ ) {
        var item = data[ i ];
        if ( Array.isArray( item ) ) {
            g_array_namestep( item, name, result );

        } else if ( item ) {
            var value = item[ name ];
            if ( value !== undefined ) {
                result.push( value );
            }
        }
    }

    return result;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function g_starstep( data, result ) {
    return Array.isArray( data ) ?
        g_array_starstep( data, result ) :
        g_other_starstep( data, result );
}

function g_other_starstep( data, result ) {
    for ( var name in data ) {
        var item = data[ name ];
        //  FIXME: А не нужно ли тут отдельно проверять, не массив ли item?

        result.push( item );
    }

    return result;
}

function g_array_starstep( data, result ) {
    for ( var i = 0, l = data.length; i < l; i++ ) {
        var item = data[ i ];
        //  FIXME: Нужно проверять, не массив ли item.

        g_starstep( item, result );
    }

    return result;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function g_index( data, root, vars, expr ) {
    var index = expr( data, root, vars );

    if ( Array.isArray( data ) && typeof index !== 'number' ) {
        return g_array_namestep( data, index, [] );
    }

    return data[ index ];
}

//  ---------------------------------------------------------------------------------------------------------------  //

function g_predicate( data, root, vars, expr ) {
    if ( is_array( data ) ) {
        return g_array_predicate( data, root, vars, expr );
    }

    if ( expr( data, root, vars ) ) {
        return data;
    }
}

function g_array_predicate( data, root, vars, expr ) {
    var result = [];

    for ( var i = 0, l = data.length; i < l; i++ ) {
        var item = data[ i ];

        if ( expr( item, root, vars ) ) {
            result.push( item );
        }
    }

    return result;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function to_string( data ) {
    if ( !data || typeof data === 'object' ) {
        return '';
    }

    return String( data );
}

function to_number( data ) {
    if ( !data || typeof data !== 'number' ) {
        return 0;
    }

    return data;
}

function to_comparable( data ) {
    var type = typeof data;
    if ( type === 'string' || type === 'number' ) {
        return data;
    }

    //  FIXME: Или же ''?
    return 0;
}

function compare( a, b ) {
    var is_a = Array.isArray( a );
    var is_b = Array.isArray( b );

    if ( is_a ) {
        if ( is_b ) {
            for ( var i = 0, l = a.length; i < l; i++ ) {
                if ( _cmp_scalar_and_array( a[ i ], b ) ) {
                    return true;
                }
            }

            return false;
        }

        return _cmp_scalar_and_array( b, a );

    } else {
        if ( is_b ) {
            return _cmp_scalar_and_array( a, b );
        }

        return ( a === b );
    }
}

function _cmp_scalar_and_array( scalar, array ) {
    for ( var i = 0, l = array.length; i < l; i++ ) {
        if ( array[ i ] === scalar ) {
            return true;
        }
    }

    return false;
}

//  ---------------------------------------------------------------------------------------------------------------  //

var FUNCTIONS = {
    enc: function( value ) {
        return encodeURIComponent( value );
    },
    length: function( value ) {
        if ( Array.isArray( value ) || typeof value === 'string' ) {
            return value.length;
        }

        return 0;
    }
};

var GLOBAL = ( function() {
    var f = new Function(
        'if ( typeof window !== "undefined" ) { return window; }' +
        'if ( typeof global !== "undefined" ) { return global; }' +
        'return null'
    );
    return f();
} )();

function get_function( vars, name ) {
    var func = ( vars && vars[ name ] ) || FUNCTIONS[ name ] || ( GLOBAL && GLOBAL[ name ] );
    if ( typeof func === 'function' ) {
        return func;
    }

    throw new Error( 'Cannot find function "' + name + '"' );
}

function get_var( vars, name ) {
    if ( vars ) {
        return vars[ name ];
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = {
    is: is_scalar,

    ts: to_string,
    tn: to_number,
    tc: to_comparable,

    c: compare,

    v: get_var,
    f: get_function,

    sn: s_namestep,
    sns: s_namestep_set,
    snd: s_namestep_delete,

    si: s_index,
    sis: s_index_set,
    sid: s_index_delete,

    sp: s_predicate,
    sps: s_predicate_set,
    spd: s_predicate_delete,

    sa: s_array_method,

    gn: g_namestep,
    gs: g_starstep,
    gp: g_predicate,
    gi: g_index,
};

