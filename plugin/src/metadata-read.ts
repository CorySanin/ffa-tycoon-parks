/// <reference path="../types/openrct2.d.ts" />

(function () {

    function writeMetadata(unset: boolean = false): void {
        const rides: string[] = (map.rides).filter(r => r.classification === 'ride' && r.status === 'open').map(r => r.name);
        context.sharedStorage.set('meta.prettyParkName', unset ? null : park.name);
        context.sharedStorage.set('meta.description', unset ? null : scenario.details);
        context.sharedStorage.set('meta.dimensions', unset ? null : map.size);
        context.sharedStorage.set('meta.existingRides', unset ? null : rides);
    }

    function main(): void {
        writeMetadata(true);
        if (context.mode !== 'title') {
            writeMetadata();
        }
        console.executeLegacy('abort');
    }

    registerPlugin({
        name: 'ffa-tycoon-metadata-read',
        version: '0.0.1',
        authors: ['Cory Sanin'],
        type: 'intransient',
        licence: 'MIT',
        targetApiVersion: 77,
        main
    });
})();