var no = require('./no.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var EventEmitter = require('events').EventEmitter;

//  ---------------------------------------------------------------------------------------------------------------  //

no.Events = ( new EventEmitter() ).__proto__;

no.Events.trigger = no.Events.emit;

no.Events.off = function(name, handler) {
    if (handler) {
        this.removeListener(name, handler);
    } else {
        this.removeAllListeners(name);
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

no.events = no.extend( {}, no.Events );

//  ---------------------------------------------------------------------------------------------------------------  //

