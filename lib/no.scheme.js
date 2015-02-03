var no = no || require('./no.base.js');

if ( no.de ) {
    module.exports = no;
}

//  ---------------------------------------------------------------------------------------------------------------  //

(function() {

//  ---------------------------------------------------------------------------------------------------------------  //

var _scid = 0;
var _schemes = {};

var scheme_default;
var scheme_scalar;
var scheme_string;
var scheme_number;
var scheme_boolean;

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme = function( scid, scheme ) {
    this._init( scid, scheme );
};

no.Scheme.prototype._init = function( scid, scheme ) {
    if ( typeof scid !== 'string' ) {
        scheme = scid;

        scid = 'scheme_' + _scid++;
    }
    if ( _schemes[ scid ] ) {
        no.error( 'Scheme "%scid" already exists', { scid: scid } );
    }
    this.scid = scid;

    this._cache = {};

    this.methods = this.methods || {};

    this.init( scheme );

    _schemes[ scid ] = this;
};

no.Scheme.prototype.init = no.op;

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.prototype.add_method = function( name, body, scheme ) {
    if ( this.methods[ name ] ) {
        no.error( 'Method %name() already defined in scheme "%scid"', {
            name: method_name,
            scid: this.scid
        } );
    }

    this.methods[ name ] = {
        body: body,
        scheme: scheme
    };
};

no.Scheme.prototype.get_method_body = function( name ) {
    return this.methods[ name ].body;
};

no.Scheme.prototype.get_method_scheme = function( name ) {
    return this.methods[ name ].scheme;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.get = function( scid ) {
    var scheme = _schemes[ scid ];

    if ( !scheme ) {
        no.error( 'No scheme "%scid"', { scid: scid } );
    }

    return scheme;
};

no.Scheme.get_method_body = function( scid, name ) {
    return no.Scheme.get( scid ).get_method_body( name );
};

no.Scheme.get_method_scheme = function( scid, name ) {
    return no.Scheme.get( scid ).get_method_scheme( name );
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.extend = function( props ) {
    var ctor = function( scid, scheme ) {
        this._init( scid, scheme );
    };

    no.inherit( ctor, this, props );

    ctor.extend = this.extend;

    return ctor;
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.extend( no.Scheme.prototype, {
    is_default: no.false,

    pred: function() {
        return this;
    },

    _get_method: function( name ) {
        var scheme = this.get_method_scheme( name );
        if ( !scheme ) {
            no.error( 'Method %name() not found in scheme "%scid"', {
                name: name,
                scid: this.scid
            } );
        }

        return no.Scheme.get( scheme );
    },

    method: function( name ) {
        var method = this._get_method( name );

        return method;
    },

    gen_prologue: function() {
        return 'var a;';
    },

    gen_epilogue: function() {
        return 'return d;';
    },

    gen_prop: function( name ) {
        return 'd["' + name + '"]';
    },

    gen_array_prop: function( name ) {
        return 'as(d,"' + name + '",[])';
    },

    gen_method: function( name, args ) {
        var js = 'd=M(' + JSON.stringify( this.scid ) + ',' + JSON.stringify( name ) + ')(d,' + args + ');';

        var scheme = this._get_method( name );
        if ( scheme.is_default() ) {
            js += 'if(d==null)return;';
            js += 'a=Array.isArray(d);';
        }

        return js;
    },

    gen_to_string: function( js ) {
        return 'ts(' + js + ')';
    },

    gen_to_number: function( js ) {
        return 'tn(' + js + ')';
    },

    gen_to_comparable: function( js ) {
        return 'tc(' + js + ')';
    },

} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Default = no.Scheme.extend( {
    is_default: no.true,

    namestep: function( name ) {
        return this;
    },

    starstep: function() {
        return new no.Scheme.Array( scheme_default );
    },

    index: function() {
        return this;
    },

    gen_prologue: function() {
        return 'if(d==null)return;var a=Array.isArray(d);';
    },

    gen_namestep: function( name ) {
        return 'if(a){d=' + this.gen_array_prop( name ) + '}else{d=' + this.gen_prop( name ) + ';if(d==null)return;a=Array.isArray(d)}';
    },

    gen_starstep: function() {
        return 'd=(a?ass:ss)(d,[]);';
    },

    gen_index: function( exid ) {
        var js = 'if(a){d=d[e' + exid + '(d,r,v)];if(d==null)return;a=Array.isArray(d)}else{return}';

        return js;
    },

    gen_pred: function( exid ) {
        return 'if(a){d=f(d,r,v,e' + exid + ',[])}else{if(!e' + exid + '(d,r,v))return}';
    },

} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Array = no.Scheme.extend( {
    init: function( array ) {
        var scheme = array[ 0 ];
        this.scheme = ( scheme ) ? this.compile( scheme ) : scheme_default;
    },

    namestep: function( name ) {
        //  FIXME: Сделать дефолтный `new Scheme.Array( new Scheme.Default() )`
        //  и отдавать его, если `scheme.is_default()`.
        //
        var scheme = this.scheme.namestep( name );

        return new no.Scheme.Array( scheme );
    },

    index: function() {
        return this.scheme;
    },

    pred: function() {
        //  FIXME: А не должно ли тут быть `return this;`?
        //  Ведь предикат опять возвращает массив?
        return this.scheme;
    },

    gen_namestep: function( name ) {
        return 'd=' + this.gen_array_prop( name ) + ';';
    },

    gen_starstep: function() {
        return 'd=ass(d,[]);';
    },

    gen_index: function( exid ) {
        return 'd=d[e' + exid + '(d,r,v)];if(d==null)return;';
    },

    gen_pred: function( exid ) {
        return 'd=f(d,r,v,e' + exid + ',[]);';
    },
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Object = no.Scheme.extend( {
    init: function( object ) {
        var compiled = this.scheme = {};

        for ( var name in object ) {
            compiled[ name ] = this.compile( object[ name ] );
        }
    },

    namestep: function( name ) {
        return this.scheme[ name ] || scheme_default;
    },

    index: function() {
        //  FIXME: Нужно бросать ошибку.
        return scheme_default;
    },

    gen_namestep: function( name ) {
        var js = 'd=' + this.gen_prop( name ) + ';';

        var scheme = this.namestep( name );
        if ( scheme.is_default() ) {
            js += 'if(d==null)return;';
            js += 'a=Array.isArray(d);';
        }

        return js;
    },

    gen_index: function( exid ) {
        //  FIXME: Нужно бросать ошибку, видимо.
        return 'return;';
    },

    gen_pred: function( exid ) {
        return 'if(!e' + exid + '(d,r,v))return;';
    },
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Scalar = no.Scheme.extend( {
    namestep: function( name ) {
        return scheme_default;
    },

    gen_to_comparable: function( js ) {
        return js;
    },
} );

no.Scheme.String = no.Scheme.Scalar.extend( {
    methods: {
        'substr': {
            body: function( s, from, to ) {
                return s.substr( from, to );
            },
            scheme: 'string'
        }
    },

    gen_to_string: function( js ) {
        return js;
    },
} );

no.Scheme.Number = no.Scheme.Scalar.extend( {
    gen_to_number: function( js ) {
        return js;
    },
} );

no.Scheme.Boolean = no.Scheme.Scalar.extend( {

} );

//  ---------------------------------------------------------------------------------------------------------------  //

scheme_default = no.Scheme.default = new no.Scheme.Default( 'default' );

scheme_scalar = no.Scheme.scalar = new no.Scheme.Scalar( 'scalar' );
scheme_string = no.Scheme.string = new no.Scheme.String( 'string' );
scheme_number = no.Scheme.number = new no.Scheme.Number( 'number' );
scheme_boolean = no.Scheme.boolean = new no.Scheme.Boolean( 'boolean' );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.prototype._object_scheme = no.Scheme.Object;
no.Scheme.prototype._array_scheme = no.Scheme.Array;

no.Scheme.prototype.compile = function( type ) {
    if ( type instanceof no.Scheme ) {
        return type;
    }

    switch ( typeof type ) {
        case 'string':
            return no.Scheme.get( type );

        /*
        case 'function':
            if ( type === no.Model || type.prototype instanceof no.Model ) {
                //  TODO:
                //  return type.scheme;

            } else {
                throw Error( 'Invalid type' );
            }
        */

        case 'object':
            return ( Array.isArray( type ) ) ? new this._array_scheme( type ) : new this._object_scheme( type );
    }

    //  FIXME: Ошибка!
};

no.scheme = function( type ) {
    return scheme_default.compile( type );
};

//  ---------------------------------------------------------------------------------------------------------------  //

})();

