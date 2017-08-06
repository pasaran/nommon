type CompiledFormat = ( date: Date ) => string;

declare module 'nommon/lib/no.date' {
    export namespace date {
        export function format( format: string, date: Date, locale?: string ): string;
        export function formatter( format: string, locale?: string ): CompiledFormat;
    }
}

