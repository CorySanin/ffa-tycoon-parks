/// <reference path="../types/openrct2.d.ts" />

(function () {
    function main(): void {
        if (context.mode === 'title') {
            console.log('ABORT$');
            console.executeLegacy('abort');
        }
        else {
            console.log('EOF$');
        }
    }

    registerPlugin({
        name: 'ci-plugin',
        version: '1.1.0',
        authors: ['Cory Sanin'],
        type: 'intransient',
        licence: 'MIT',
        targetApiVersion: 77,
        main
    });
})();