if (typeof String.prototype.repeat !== 'function') {

    String.prototype.repeat = function(n) {
        if (n === 0) { return ''; }

        //  FIXME: Померять. Может просто this лучше.
        var s = this.valueOf();

        //  FIXME: Померять. Может лучше if, или вообще без этого блока.
        switch (n) {
            case 1:
                return s;
            case 2:
                return s + s;
            case 3:
                return s + s + s;
        }

        var result = '';

        while  (n > 1) {
            if (n & 1) {
                result += s;
            }
            s += s;
            n >>= 1;
        };

        return result + s;
    };

}

//  ---------------------------------------------------------------------------------------------------------------  //

if (typeof String.prototype.padLeft !== 'function') {

    String.prototype.padLeft = function(n, ch) {
        //  FIXME: Померять. Может просто this лучше?
        var s = this.valueOf();

        if (n === 0) { return s; }

        var l = n - this.length;
        if (l <= 0) {
            return s;
        }

        ch = ch || ' ';

        //  FIXME: Померять. Может лучше if, или вообще без этого блока.
        switch (l) {
            case 1:
                return ch + s;
            case 2:
                return ch + ch + s;
        }

        return ch.repeat(l) + s;
    };

}

if (typeof String.padLeft !== 'function') {

    String.padLeft = function(s, n, ch) {
        return s.toString().padLeft(n, ch);
    };

}

//  ---------------------------------------------------------------------------------------------------------------  //

