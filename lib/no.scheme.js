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
        return 'var is_array;';
    },

    gen_prop: function( name ) {
        return 'data[' + JSON.stringify( name ) + ']';
    },

    gen_array_prop: function( name ) {
        return 'array_step(data,' + JSON.stringify( name ) + ',[])';
    }
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Default = no.Scheme.extend( {
    is_default: no.true,

    step: function( name ) {
        return this;
    },

    gen_prologue: function() {
        return 'if(data==null){return;}var is_array=Array.isArray(data);';
    },

    gen_step: function( name ) {
        return 'if(is_array){data=' + this.gen_array_prop( name ) + '}else{data=' + this.gen_prop( name ) + 'if(data==null){return}is_array=Array.isArray(data)}';
    },

    gen_last_step: function( name ) {
        return 'return (is_array)?' + this.gen_array_prop( name ) + ':' + this.gen_prop( name ) + ';';
    }
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Array = no.Scheme.extend( {
    init: function( array ) {
        var scheme = array[ 0 ];
        this.scheme = ( scheme ) ? compile_scheme( scheme ) : no.Scheme.default;
    },

    step: function( name ) {
        var scheme = this.scheme.step( name );

        return new no.Scheme.Array( scheme );
    },

    gen_step: function( name ) {
        return 'data=' + this.gen_array_prop( name ) + ';';
    },

    gen_last_step: function( name ) {
        return 'return ' + this.gen_array_prop( name ) + ';';
    }
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Object = no.Scheme.extend( {
    init: function( object ) {
        var compiled = this.scheme = {};

        for ( var name in object ) {
            compiled[ name ] = compile_scheme( object[ name ] );
        }
    },

    step: function( name ) {
        return this.scheme[ name ] || no.Scheme.default;
    },

    gen_step: function( name ) {
        var js = 'data=' + this.gen_prop( name ) + ';';

        var scheme = this.step( name );
        if ( scheme.is_default() ) {
            js += 'if(data==null){return;}';
            js += 'is_array=Array.isArray(data);';
        }

        return js;
    },

    gen_last_step: function( name ) {
        return 'return ' + this.gen_prop( name ) + ';';
    }
} );

//  ---------------------------------------------------------------------------------------------------------------  //

no.Scheme.Scalar = no.Scheme.extend( {
    step: function( name ) {
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
        return scheme;
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

