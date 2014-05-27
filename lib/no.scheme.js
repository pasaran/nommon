var no = no || require( './no.base.js' );

if ( no.de ) {
    module.exports = no;
}

( function() {

//  ---------------------------------------------------------------------------------------------------------------  //

var _scid = 0;
var _schemes = {};

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
        no.error( 'Scheme with id "%s" already exists', scid );
    }

    this.scid = scid;

    this.init( scheme );

    _schemes[ scid ] = this;
};

no.Scheme.prototype.init = no.op;

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

    gen_index: function( exid ) {
        return 'if(a){d=d[e' + exid + '(d,r)];if(d==null)return;a=Array.isArray(d)}else{return}';
    },

    gen_pred: function( exid ) {
        return 'if(a){d=f(d,r,e' + exid + ',[])}else{if(!e' + exid + '(d,r))return}';
    },

    gen_guard: function( exid ) {
        return 'if(!' + exid + '(d,r))return;';
    },

} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Default = no.Scheme.extend( {
    is_default: no.true,

    namestep: function( name ) {
        return this;
    },

    starstep: function() {
        return new no.Scheme.Array( no.Scheme.default );
    },

    gen_prologue: function() {
        return 'if(d==null)return;var a=Array.isArray(d);';
    },

    gen_namestep: function( name ) {
        return 'if(a){d=' + this.gen_array_prop( name ) + '}else{d=' + this.gen_prop( name ) + ';if(d==null)return;a=Array.isArray(d)}';
    },

    gen_starstep: function() {
        return 'd=(a?ass:ss)(d,[]);';
    }
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Array = no.Scheme.extend( {
    init: function( array ) {
        var scheme = array[ 0 ];
        this.scheme = ( scheme ) ? compile_scheme( scheme ) : no.Scheme.default;
    },

    namestep: function( name ) {
        //  FIXME: Сделать дефолтный `new Scheme.Array( new Scheme.Default() )`
        //  и отдавать его, если `scheme.is_default()`.
        //
        var scheme = this.scheme.namestep( name );

        return new no.Scheme.Array( scheme );
    },

    gen_namestep: function( name ) {
        return 'd=' + this.gen_array_prop( name ) + ';';
    },

    gen_starstep: function() {
        return 'd=ass(d,[]);';
    },
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Object = no.Scheme.extend( {
    init: function( object ) {
        var compiled = this.scheme = {};

        for ( var name in object ) {
            compiled[ name ] = compile_scheme( object[ name ] );
        }
    },

    namestep: function( name ) {
        return this.scheme[ name ] || no.Scheme.default;
    },

    gen_namestep: function( name ) {
        var js = 'data=' + this.gen_prop( name ) + ';';

        var scheme = this.namestep( name );
        if ( scheme.is_default() ) {
            js += 'if(d==null)return;';
            js += 'a=Array.isArray(d);';
        }

        return js;
    },
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Scalar = no.Scheme.extend( {
    namestep: function( name ) {
        return no.Scheme.default;
    }
} );

no.Scheme.String = no.Scheme.Scalar.extend( {
    /*
    methods: {
        'string substr(number,number)': function( s, from, to ) {
            return s.substr( from, to );
        }
    }
    */
} );

no.Scheme.Number = no.Scheme.Scalar.extend( {

} );

no.Scheme.Boolean = no.Scheme.Scalar.extend( {

} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.scheme = function( type ) {
    return ( Array.isArray( type ) ) ? new no.Scheme.Array( type ) : new no.Scheme.Object( type );
};

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_scheme( type ) {
    if ( type instanceof no.Scheme ) {
        return type;
    }

    switch ( typeof type ) {
        case 'string':
            var scheme = _schemes[ type ];
            if ( !scheme ) {
                no.error( 'Undefined scheme "%s"', type );
            }
            return scheme;

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
            return no.scheme( type );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.default = new no.Scheme.Default( 'default' );

no.Scheme.scalar = new no.Scheme.Scalar( 'scalar' );
no.Scheme.string = new no.Scheme.String( 'string' );
no.Scheme.number = new no.Scheme.Number( 'number' );
no.Scheme.boolean = new no.Scheme.Boolean( 'boolean' );

//  ---------------------------------------------------------------------------------------------------------------  //

} )();

