declare module 'nommon/lib/no.number' {
    export namespace number {
        export function format( number: number, digits: number | null, sep?: string, point?: string ): string;
    }
}

