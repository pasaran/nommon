//  Пример:
//
//      var ModelBar = no.Model.extend( {
//          id: 'bar',
//          scheme: {
//              bar: 'scalar'
//          }
//      } );
//
//      var ModelFoo = no.Model.extend( {
//          id: 'foo',
//          scheme: {
//              foo: ModelBar
//              //  foo: 'bar'
//          }
//      } );
//
//      var foo = new ModelFoo( {
//          foo: {
//              bar: 42
//          }
//      } )
//
//      foo.select( '.foo.bar' ) // 42
//
//      scheme = new no.Scheme( {
//          String, 'string'
//          Number, 'number'
//          'scalar'
//          Boolean, 'boolean'
//
//          'color'
//          'timestamp'
//          ...
//
//          function() {}       //  ctor of model?
//          'foo'               //  id of scheme or model
//          'foo.id'            //  строка с id модели foo
//          instanceof Scheme   //  scheme
//          instanceof Model    //  model with scheme
//
//          //  модификаторы:
//
//          'string?'
//          'string!'
//
//      } )
//
//      new Scheme( {
//          'get_foo( scalar, * )': 'foo'
//      } )
//

var no = no || require( './no.base.js' );

if ( no.de ) {
    module.exports = no;
}

( function() {

//  ---------------------------------------------------------------------------------------------------------------  //

var _id = 0;

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme = function( id, scheme ) {
    if ( typeof id !== 'string' ) {
        scheme = id;

        id = 'scheme_' + _id++;
    }

    if ( _schemes[ id ] ) {
        no.error( 'Scheme with id "%s" already exists', id );
    }

    this.id = id;
    this.scheme = compile_scheme( scheme );
};

//  ---------------------------------------------------------------------------------------------------------------  //

var scheme_default = no.Scheme.default = new no.Scheme( 'default', {} );
var scheme_scalar = no.Scheme.scalar = new no.Scheme.Scalar( 'scalar', {} );
var scheme_string = no.Scheme.string = new no.Scheme.String( 'string', {} );
var scheme_number = no.Scheme.number = new no.Scheme.Number( 'number', {} );
var scheme_boolean = no.Scheme.boolean = new no.Scheme.Boolean( 'boolean', {} );

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_scheme( scheme ) {
    var compiled = {};

    for ( var name in scheme ) {
        var type = scheme[ name ];

        compiled[ name ] = compiled_scheme_type( type );
    }

    return compiled;
}

function compile_scheme_type( type ) {
    if ( type instanceof no.Scheme ) {
        return type;
    }

    switch ( type ) {
        case String:
        case 'string':
            //  TODO:
            //  return scheme_string;
            return scheme_scalar;

        case 'scalar':
            //  TODO:
            return scheme_scalar;

        case Number:
        case 'number':
            //  TODO:
            //  return scheme_number;
            return scheme_scalar;

        case Boolean:
        case 'boolean':
            //  TODO:
            //  return scheme_boolean;
            return scheme_scalar;
    }

    switch ( typeof type ) {
        case 'string':
            var scheme = _schemes[ type ];
            if ( !scheme ) {
                no.error( 'Undefined scheme "%s"', type );
            }

        case 'function':
            if ( type === no.Model || type.prototype instanceof no.Model ) {
                //  TODO:
                //  return type.scheme;

            } else {
                throw Error( 'Invalid type' );
            }

        case 'object':
            if ( Array.isArray( type ) ) {
                return new no.Scheme.Collection( type[ 0 ] );

            } else {
                return new no.Scheme( type );
            }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.prototype.step = function( name ) {
    return this.scheme[ name ] || scheme_scalar;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.prototype.gen_prop = function( name ) {
    return 'data[ ' + JSON.stringify( name ) + ']';
};

no.Scheme.prototype.gen_step = function( name ) {
    var step = '';
    step += 'if ( is_array ) { ' + this.gen_array_step( name ) + '} else { ' + this.gen_simple_step( name ) + '}';
    step += 'if ( data == null ) { return data; }';
    return step;
};

no.Scheme.prototype.gen_simple_step = function( name ) {
    var step = '';
    step += 'data = ' + this.gen_prop( name ) + ';';
    step += 'is_array = Array.isArray( data )';
    return step;
};

no.Scheme.prototype.gen_array_step = function( name ) {
    return 'data = array_step( data, ' + JSON.stringify( name ) + ', [] );';
};

no.Scheme.prototype.gen_predicate = function( predicate ) {

};

no.Scheme.prototype.gen_index = function( index ) {

};

no.Scheme.prototype.gen_guard = function( guard ) {

};

//  ---------------------------------------------------------------------------------------------------------------  //

} )();

