import path from 'path';
import * as fsp from 'fs/promises';
import ky from 'ky';
import { getSourceGame } from './source-identifier.ts';

function requireEnvVar(varName: string): string {
    if (!(varName in process.env) || !process.env[varName]) {
        throw new Error(`Environment variable ${varName} is not set`);
    }
    return process.env[varName];
}

const PARKSDIR = process.env.PARKSDIR || '/parks/';
const METADATAFILE = process.env.METADATAFILE || '/distribution/meta.json';
const SCREENSHOTDIR = process.env.SCREENSHOTDIR || '/distribution/thumbnails/';
const SCREENSHOTTERURL = requireEnvVar('SCREENSHOTTERURL');
const SCREENSHOTTERTOKEN = requireEnvVar('SCREENSHOTTERTOKEN');

type NumericRep = number | string;

type ScreenshotOptions = {
    type: 'cropped',
    zoom?: NumericRep,
    rotation?: NumericRep,
    width: NumericRep,
    height: NumericRep,
    x?: NumericRep,
    y?: NumericRep
}

type ParkMetaData = {
    baseParkName: string;
    prettyParkName: string;
    description: string;
    existingRides: string[];
    inventionList: string[];
    source: string;
};

function baseParkName(parkfile: string): string {
    const basename = path.basename(parkfile);
    return basename.substring(0, basename.lastIndexOf('-'));
}

function prettyParkName(parkfile: string): string {
    return baseParkName(parkfile).split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function appendScreenshotOptions(body: FormData, options: ScreenshotOptions) {
    for (let key in options) {
        body.append(key, options[key]);
    }
}

async function generateScreenshot(parkfile: string, outputDir: string): Promise<void> {
    const screenshotPath = path.join(outputDir, `${baseParkName(parkfile)}.png`);
    const screenshotOptions: ScreenshotOptions = {
        type: 'cropped',
        width: 640,
        height: 360,
        rotation: 0,
        zoom: 2
    }
    const body = new FormData();
    body.append('park', new Blob([await fsp.readFile(parkfile)], { type: 'application/octet-stream' }));
    appendScreenshotOptions(body, screenshotOptions);
    const response = await ky.post(`${SCREENSHOTTERURL}/upload`, {
        body,
        timeout: 60000,
        headers: {
            Authorization: `Bearer ${SCREENSHOTTERTOKEN}`
        }
    });
    if (!response.ok || !response.body) {
        throw new Error(`Failed to generate screenshot for ${parkfile}: ${response.statusText}`);
    }
    await fsp.writeFile(screenshotPath, response.body);
}

async function generateMetaData(parkfile: string): Promise<Partial<ParkMetaData>> {
    const realParkName = prettyParkName(parkfile); // TODO: get park name from save file
    return {
        baseParkName: baseParkName(parkfile),
        prettyParkName: realParkName,
        source: getSourceGame(realParkName),
    };
}

const parkfiles = (await fsp.readdir(PARKSDIR, { withFileTypes: true })).filter(f => f.isFile()).map(f => path.join(PARKSDIR, f.name));
const metadata: Partial<ParkMetaData>[] = [];

for (const parkfile of parkfiles) {
    await generateScreenshot(parkfile, SCREENSHOTDIR);
    metadata.push(await generateMetaData(parkfile));
}

await fsp.writeFile(METADATAFILE, JSON.stringify({ parks: metadata }, null, 2), 'utf-8');
