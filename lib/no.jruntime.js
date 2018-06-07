function is_scalar( data ) {
    return ( data == null || typeof data !== 'object' );
}

//  ---------------------------------------------------------------------------------------------------------------  //

function s_do_namestep( data, root, vars, value, step, next ) {
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

function s_set_namestep( data, value, step ) {
    if ( is_scalar( data ) || Array.isArray( data ) ) {
        return data;
    }

    var new_data = Object.assign( {}, data );
    new_data[ step ] = value;

    return new_data;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function s_do_index( data, root, vars, value, expr, next ) {
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

function s_set_index( data, root, vars, value, expr ) {
    if ( !Array.isArray( data ) ) {
        return data;
    }

    var index = expr( data, root, vars );

    var old_data = data[ index ];
    if ( value === old_data ) {
        return data;
    }

    var new_data = data.concat();
    new_data[ index ] = value;

    return new_data;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function s_do_predicate( data, root, vars, value, expr, next ) {
    return ( Array.isArray( data ) ) ?
        s_do_array_predicate( data, root, vars, value, expr, next ) :
        s_do_other_predicate( data, root, vars, value, expr, next );
}

function s_do_other_predicate( data, root, vars, value, expr, next ) {
    var passed = expr( data, root, vars );

    return ( passed ) ? next( data, root, vars, value ) : data;
}

function s_do_array_predicate( data, root, vars, value, expr, next ) {
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

function s_set_predicate( data, root, vars, value, expr ) {
    return ( Array.isArray( data ) ) ?
        s_set_array_predicate( data, root, vars, value, expr ) :
        s_set_other_predicate( data, root, vars, value, expr );
}

//  FIXME.
function s_set_other_predicate( data, root, vars, value, expr ) {
    if ( is_scalar( data ) || !expr( data, root, vars ) ) {
        return data;
    }

    //  FIXME: Блабла.
}

function s_set_array_predicate( data, root, vars, value, expr ) {
    var new_data = data.concat();

    var changed = false;
    for ( var i = 0, l = data.length; i < l; i++ ) {
        var old_value = data[ i ];

        if ( value !== old_value ) {
            var passed = expr( old_value, root, vars );

            if ( passed ) {
                changed = true;

                new_data[ i ] = value;
            }
        }
    }

    return ( changed ) ? new_data : data;
}

//  ---------------------------------------------------------------------------------------------------------------  //

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

function g_starstep( data, result ) {
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

function g_predicate( data, root, vars, expr, result ) {
    for ( var i = 0, l = data.length; i < l; i++ ) {
        var item = data[ i ];

        if ( expr( item, root, vars ) ) {
            result.push( item );
        }
    }

    return result;
}

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

module.exports = {
    s_do_namestep,
    s_set_namestep,
    s_do_index,
    s_set_index,
    s_do_predicate,
    s_set_predicate,

    as: g_array_namestep,
    ss: g_starstep,
    ass: g_array_starstep,
    f: g_predicate,

    ts: to_string,
    tn: to_number,
    tc: to_comparable,
    c: compare,
};

