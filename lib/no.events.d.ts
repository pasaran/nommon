type EventsCallback = ( name: string, ...values: Array<any> ) => void;

declare module 'nommon/lib/no.events' {
    export class Events {
        on( name: string, callback: EventsCallback ): this;
        off( name: string, callback: EventsCallback ): this;
        once( name: string, callback: EventsCallback ): this;
        trigger( name: string, ...values: Array<any> ): this;
        atrigger( name: string, ...values: Array<any> ): void;
        forward( name: string, obj: Events ): this;
    }
}

