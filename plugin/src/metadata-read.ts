/// <reference path="../types/openrct2.d.ts" />

(function () {

    function writeMetadata(): void {
        context.sharedStorage.set('meta.parkName', park.name);
        context.sharedStorage.set('meta.description', scenario.details);
        context.sharedStorage.set('meta.dimensions', map.size);
        context.sharedStorage.set('meta.existingRides', map.rides);
    }

    function main(): void {
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