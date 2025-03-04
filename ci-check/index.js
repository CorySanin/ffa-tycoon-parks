const spawn = require('child_process').spawn;

const ObjectRegex = new RegExp('\\[(.+)\\]');
const TimeOut = 120000;

let save = process.argv[2];
save = save.substring(save.indexOf('/parks/'));

console.log(`Checking save ${save} ...`);

function processLines(stdout) {
    let notFound = [];
    stdout.forEach(str => {
        let lines = str.split('\n').map(s => s.trim());
        lines.forEach(l => {
            if (l.includes('Object not found.')) {
                l = l.substring(2);
                let m = l.match(ObjectRegex);
                if (m && m[1]) {
                    notFound.push(m[1].trim());
                }
            }
        });
    });
    return notFound;
}

function checkSave(file) {
    return new Promise((resolve, reject) => {
        let stdout = [];
        let child = spawn('openrct2-cli', [`${file}`]);

        let timeout = setTimeout(() => {
            stdout.forEach(l => {
                console.log(l);
            });
            reject(['TIMED OUT']);
            child.kill();
        }, TimeOut);

        child.stdout.setEncoding('utf8');
        child.stdout.on('data', function (data) {
            let str = data.toString();
            if (str.includes(`'EOF$`)) {
                clearTimeout(timeout);
                child.kill();
                let notfound = processLines(stdout);
                if(notfound.length === 0){
                    resolve();
                }
                else{
                    reject(notfound);
                }
            }
            else if (str.includes(`'ABORT$`)) {
                clearTimeout(timeout);
                child.kill();
                reject(['Park file failed to load.']);
            }
            else {
                stdout.push(str);
            }
        });
    });
}

(async function () {
    try {
        await checkSave(save);
        console.log('All required objects present.\n');
        process.exit(0);
    }
    catch (ex) {
        console.log(`\nThe following objects are missing for ${save}:\n${ex.join('\n')}`);
        process.exit(ex.length || 1);
    }
})();