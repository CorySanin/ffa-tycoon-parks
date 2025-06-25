/// <reference path="../types/openrct2.d.ts" />

(function () {

    const NAMESPACE = 'ffa-tycoon-authoring';

    function writeMetadata(unset: boolean = false): void {
        const parkStorage = context.getParkStorage(NAMESPACE)
        const rides: string[] = (map.rides).filter(r => r.classification === 'ride' && r.status === 'open').map(r => r.name);
        const und = undefined;
        context.sharedStorage.set('meta.prettyParkName', unset ? und : park.name);
        context.sharedStorage.set('meta.description', unset ? und : scenario.details);
        context.sharedStorage.set('meta.dimensions', unset ? und : map.size);
        context.sharedStorage.set('meta.existingRides', unset ? und : rides);
        context.sharedStorage.set('meta.thumbnail', unset ? und : parkStorage.get('thumbnail', undefined));
        context.sharedStorage.set('meta.authors', unset ? und : parkStorage.get('authors', undefined));
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