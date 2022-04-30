function main() {
    console.log('EOF$');
}

registerPlugin({
    name: 'ci-plugin',
    version: '1.0.0',
    authors: ['Cory Sanin'],
    type: 'intransient',
    licence: 'MIT',
    main
})