/// <reference path="../types/openrct2.d.ts" />

(function () {
    function main(): void {
    }

    registerPlugin({
        name: 'ffa-tycoon-authoring',
        version: '0.0.1',
        authors: ['Cory Sanin'],
        type: 'intransient',
        licence: 'MIT',
        targetApiVersion: 77,
        main
    });
})();