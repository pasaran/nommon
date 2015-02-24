var no = no || require( './no.base.js' );

if ( no.de ) {
    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

( function() {

//  ---------------------------------------------------------------------------------------------------------------  //

var _tid = 0;
var _types = {};

//  ---------------------------------------------------------------------------------------------------------------  //

var type_any;

var type_string;
var type_number;
var type_boolean;

var type_array_of_any;

//  ---------------------------------------------------------------------------------------------------------------  //

no.Type = function( tid, type ) {
    this._init( tid, type );
};

no.Type.prototype._init = function( tid, type ) {
    if ( typeof tid !== 'string' ) {
        type = tid;

        tid = '__type_' + _tid++;
    }
    if ( _types[ tid ] ) {
        no.error( 'Type "%tid" already exists', { tid: tid } );
    }
    this.tid = tid;

    this._compiled_jpaths = {};
    this._props = {};
    this._methods = {};

    this.init( type );

    _types[ tid ] = this;
};

no.Type.prototype.init = no.op;

//  ---------------------------------------------------------------------------------------------------------------  //

no.Type.get = function( tid ) {
    var type = _types[ tid ];

    if ( !type ) {
        no.error( 'No type "%tid"', { tid: tid } );
    }

    return type;
};

//  ---------------------------------------------------------------------------------------------------------------  //

var rx_prop = /^(.+?)(?:\(\s*(.*?)\s*\))?$/;
var rx_signature_delim = /\s*,\s*/;

//  Возможные форматы описания свойств и методов:
//
//      {
//          'length': 'number',
//          'length': {
//              type: 'number',
//              body: 'length'
//          },
//          'length': {
//              type: 'number',
//              body: function( self ) {
//                  return self.length;
//              }
//          },
//
//          'substr( number, number )': 'string',
//          'substr( number, number )': {
//              type: 'string',
//              body: 'substr'
//          },
//          'substr( number, number )': {
//              type: 'string',
//              body: function( self, from, to ) {
//                  return self.substr( from, to );
//              }
//          }
//      }
//
no.Type.prototype._compile_props = function( props ) {
    var _methods = this._methods;
    var _props = this._props;

    for ( var prop in props ) {
        var parts = rx_prop.exec( prop );

        var name = parts[ 1 ];
        var type = props[ type ];
        var body;

        if ( typeof type === 'string' ) {
            body = name;

        } else {
            body = type.body;
            type = type.type;
        }

        var signature = parts[ 2 ];
        if ( signature != null ) {
            //  Method.
            signature = signature.split( rx_signature_delim );

            var full_name = name + '(' + signature.join( ',' ) + ')';

            var methods_by_name = _methods[ name ] || (( _methods[ name ] = {} ));
            methods_by_name[ full_name ] = {
                type: type,
                body: body,
                signature: signature
            };

        } else {
            //  Property.

            _props[ name ] = {
                type: type,
                body: body
            };
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Type.prototype.castable_to = no.false;

//  ---------------------------------------------------------------------------------------------------------------  //

no.Type.extend = function( props ) {
    var ctor = function( tid, type ) {
        this._init( tid, type );
    };

    no.inherit( ctor, this, props );

    ctor.extend = this.extend;

    return ctor;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.extend( no.Type.prototype, {
    is_default: no.false,

    type_pred: function() {
        return this;
    },

    _get_method: function( name ) {
        var type = this.get_method_type( name );
        if ( !type ) {
            no.error( 'Method %name() not found in type "%tid"', {
                name: name,
                tid: this.tid
            } );
        }

        return no.Type.get( type );
    },

    type_method: function( name ) {
        var method = this._get_method( name );

        return method;
    },

    js_prologue: function() {
        return 'var a;';
    },

    js_epilogue: function() {
        return 'return d;';
    },

    js_prop: function( name ) {
        return 'd["' + name + '"]';
    },

    js_array_prop: function( name ) {
        return 'as(d,"' + name + '",[])';
    },

    js_native_method: function( name, args ) {
        //  TODO.
    },

    js_method: function( name, args ) {
        var js = 'd=M(' + JSON.stringify( this.tid ) + ',' + JSON.stringify( name ) + ')(d,' + args + ');';

        var type = this._get_method( name );
        if ( type.is_default() ) {
            js += 'if(d==null)return;';
            js += 'a=Array.isArray(d);';
        }

        return js;
    },

    js_to_string: function( js ) {
        return 'ts(' + js + ')';
    },

    js_to_number: function( js ) {
        return 'tn(' + js + ')';
    },

    js_to_comparable: function( js ) {
        return 'tc(' + js + ')';
    },

} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Type.Any = no.Type.extend( {
    is_default: no.true,

    type_namestep: function( name ) {
        return this;
    },

    type_starstep: function() {
        return type_array_of_any;
    },

    type_index: function() {
        return this;
    },

    js_prologue: function() {
        return 'if(d==null)return;var a=Array.isArray(d);';
    },

    js_namestep: function( name ) {
        return 'if(a){d=' + this.js_array_prop( name ) + '}else{d=' + this.js_prop( name ) + ';if(d==null)return;a=Array.isArray(d)}';
    },

    js_starstep: function() {
        return 'd=(a?ass:ss)(d,[]);';
    },

    js_index: function( exid ) {
        var js = 'if(a){d=d[e' + exid + '(d,r,v)];if(d==null)return;a=Array.isArray(d)}else{return}';

        return js;
    },

    js_pred: function( exid ) {
        return 'if(a){d=f(d,r,v,e' + exid + ',[])}else{if(!e' + exid + '(d,r,v))return}';
    },

} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Type.Array = no.Type.extend( {
    init: function( array ) {
        var type = array[ 0 ];
        this.type = ( type ) ? this.compile( type ) : type_any;
    },

    type_namestep: function( name ) {
        //  FIXME: Сделать дефолтный `new Type.Array( new Type.Any() )`
        //  и отдавать его, если `type.is_default()`.
        //
        var type = this.type.type_namestep( name );

        return ( type.is_default() ) ? type_array_of_any : new no.Type.Array( type );
    },

    type_index: function() {
        return this.type;
    },

    type_pred: function() {
        //  FIXME: А не должно ли тут быть `return this;`?
        //  Ведь предикат опять возвращает массив?
        return this.type;
    },

    js_namestep: function( name ) {
        return 'd=' + this.js_array_prop( name ) + ';';
    },

    js_starstep: function() {
        return 'd=ass(d,[]);';
    },

    js_index: function( exid ) {
        return 'd=d[e' + exid + '(d,r,v)];if(d==null)return;';
    },

    js_pred: function( exid ) {
        return 'd=f(d,r,v,e' + exid + ',[]);';
    },
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Type.Object = no.Type.extend( {
    init: function( object ) {
        var compiled = this.type = {};

        for ( var name in object ) {
            compiled[ name ] = this.compile( object[ name ] );
        }
    },

    type_namestep: function( name ) {
        return this.type[ name ] || type_any;
    },

    type_index: function() {
        //  FIXME: Нужно бросать ошибку.
        return type_any;
    },

    js_namestep: function( name ) {
        var js = 'd=' + this.js_prop( name ) + ';';

        var type = this.type_namestep( name );
        if ( type.is_default() ) {
            js += 'if(d==null)return;';
            js += 'a=Array.isArray(d);';
        }

        return js;
    },

    js_index: function( exid ) {
        //  FIXME: Нужно бросать ошибку, видимо.
        return 'return;';
    },

    js_pred: function( exid ) {
        return 'if(!e' + exid + '(d,r,v))return;';
    },
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Type.Scalar = no.Type.extend( {
    type_namestep: function( name ) {
        return type_any;
    },

    js_to_comparable: function( js ) {
        return js;
    },
} );

no.Type.String = no.Type.Scalar.extend( {
    methods: {
        'substr': {
            body: function( s, from, to ) {
                return s.substr( from, to );
            },
            type: 'string'
        }
    },

    js_to_string: function( js ) {
        return js;
    },
} );

no.Type.Number = no.Type.Scalar.extend( {
    js_to_number: function( js ) {
        return js;
    },
} );

no.Type.Boolean = no.Type.Scalar.extend( {

} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Type.Maybe = no.Type.Any.extend( {

} );

//  ---------------------------------------------------------------------------------------------------------------  //

type_any = no.Type.default = new no.Type.Any( 'default' );

type_scalar = no.Type.scalar = new no.Type.Scalar( 'scalar' );
type_string = no.Type.string = new no.Type.String( 'string' );
type_number = no.Type.number = new no.Type.Number( 'number' );
type_boolean = no.Type.boolean = new no.Type.Boolean( 'boolean' );

type_array_of_any = new no.Type.Array( type_any );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Type.prototype._object_type = no.Type.Object;
no.Type.prototype._array_type = no.Type.Array;

no.Type.prototype.compile = function( type ) {
    if ( type instanceof no.Type ) {
        return type;
    }

    switch ( typeof type ) {
        case 'string':
            return no.Type.get( type );

        /*
        case 'function':
            if ( type === no.Model || type.prototype instanceof no.Model ) {
                //  TODO:
                //  return type.type;

            } else {
                throw Error( 'Invalid type' );
            }
        */

        case 'object':
            return ( Array.isArray( type ) ) ? new this._array_type( type ) : new this._object_type( type );
    }

    //  FIXME: Ошибка!
};

no.type = function( tid, type, props ) {
    if ( typeof tid !== 'string' ) {
        props = type;
        type = tid;

        tid = '_type' + _tid++;
    }

    if ( Array.isArray( type ) ) {
        return new no.Type.Array( tid, type, props );
    }

    if ( type && typeof type === 'object' ) {
        return new no.Type.Object( tid, type );
    }

    no.error( 'Type description should be object or array' );
};

//  ---------------------------------------------------------------------------------------------------------------  //

} )();

