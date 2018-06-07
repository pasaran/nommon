var compilers = {

    /*
    js_prologue: function() {
        return 'var a;';
    },
    */

    prologue: function() {
        return 'if(d==null)return;var a=Array.isArray(d);';
    },

    prop: function( name ) {
        return 'd["' + name + '"]';
    },

    array_prop: function( name ) {
        return 'as(d,"' + name + '",[])';
    },

    to_string: function( js ) {
        return 'ts(' + js + ')';
    },

    to_number: function( js ) {
        return 'tn(' + js + ')';
    },

    to_comparable: function( js ) {
        return 'tc(' + js + ')';
    },

    namestep: function( name, is_last ) {
        if ( is_last ) {
            return 'return a?' + compilers.array_prop( name ) + ':' + compilers.prop( name );
        }

        return 'if(a){d=' + compilers.array_prop( name ) + '}else{d=' + compilers.prop( name ) + ';if(d==null)return;a=Array.isArray(d)}';
    },

    starstep: function( is_last ) {
        if ( is_last ) {
            return 'return (a?ass:ss)(d,[])';
        }

        return 'd=(a?ass:ss)(d,[]);a=1;';
    },

    index: function( exid, is_last ) {
        //  FIXME: Кажется, можно и не на массив разрешать index.
        //  Переименовать index в prop чтоль.

        if ( is_last ) {
            return 'if(a)return d[e' + exid + '(d,r,v)]';
        }

        return 'if(!a)return;d=d[e' + exid + '(d,r,v)];if(d==null)return;a=Array.isArray(d);';
    },

    predicate: function( exid, is_last ) {
        if ( is_last ) {
            return 'if(a)return f(d,r,v,e' + exid + ',[]);if(e' + exid + '(d,r,v))return d';
        }

        return 'if(a){d=f(d,r,v,e' + exid + ',[])}else{if(!e' + exid + '(d,r,v))return}';
    },

    /*
     * Array
     *

    namestep: function( name, is_last ) {
        if ( is_last ) {
            return 'return ' + this.js_array_prop( name );
        }

        return 'd=' + this.js_array_prop( name ) + ';';
    },

    starstep: function( is_last ) {
        if ( is_last ) {
            return 'return ass(d,[])';
        }

        return 'd=ass(d,[]);';
    },

    index: function( exid, is_last ) {
        if ( is_last ) {
            return 'return d[e' + exid + '(d,r,v)]';
        }

        return 'd=d[e' + exid + '(d,r,v)];if(d==null)return;';
    },

    predicate: function( exid, is_last ) {
        if ( is_last ) {
            return 'return f(d,r,v,e' + exid + ',[])';
        }

        return 'd=f(d,r,v,e' + exid + ',[]);';
    },

    */

};

module.exports = compilers;

