const path = require( 'path' );

module.exports = {
    entry: './lib/index.js',
    output: {
        library: 'no',
        libraryTarget: 'window',
        path: path.resolve( 'dist' ),
        filename: 'nommon.min.js'
    }
};

