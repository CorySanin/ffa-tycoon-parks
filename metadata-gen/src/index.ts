/// <reference path="../../plugin/types/common.d.ts" />
import path from 'path';
import * as fsp from 'fs/promises';
import { spawn } from 'child_process';
import { Buffer } from 'buffer';
import ky from 'ky';
import { PNG } from 'pngjs';
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
const CHILDPROCESSTIMEOUT = 120000;

type NumericRep = number | string;

type ScreenshotOptions = {
    type: 'cropped',
    zoom?: NumericRep,
    rotation?: NumericRep,
    width: NumericRep,
    height: NumericRep,
    x?: NumericRep,
    y?: NumericRep,
    z?: NumericRep
}

type ParkMetaData = {
    baseParkName: string;
    prettyParkName: string;
    description: string;
    dimensions: { x: number, y: number };
    existingRides: string[];
    inventionList: string[];
    source: string;
    authors: string[];
    thumbnail: Thumbnail;
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

function loadPark(parkfile: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = spawn('openrct2-cli', [parkfile], {
            stdio: ['ignore', process.stdout, process.stderr]
        });
        const to = setTimeout(async () => {
            proc.kill();
            reject(new Error('Timed out'));
        }, CHILDPROCESSTIMEOUT);
        proc.on('exit', (code): void => {
            clearTimeout(to);
            if (code && code !== 0) {
                console.log(code);
                reject(new Error(`exited with ${code}`));
            }
            else {
                resolve();
            }
        });
    });
}

async function readParkFile(parkfile: string): Promise<Partial<ParkMetaData>> {
    await loadPark(parkfile);
    const pluginStoragePath: string = path.join(process.env['HOME'], '.config', 'OpenRCT2', 'plugin.store.json');
    const pluginStorage: { meta: Partial<ParkMetaData> } = JSON.parse((await fsp.readFile(pluginStoragePath)).toString());
    return pluginStorage.meta;
}

function readPng(input: Buffer): Promise<PNG> {
    return new Promise(async (resolve, reject) => {
        new PNG({}).parse(input, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}

async function isScreenshotNew(path: string, buffer: ArrayBuffer) {
    const pngPromise = readPng(await fsp.readFile(path));
    try {
        await pngPromise
    }
    catch (err) {
        console.error(err);
        return true;
    }
    const png1 = await pngPromise;
    const png2 = await readPng(Buffer.from(buffer));

    if (png1.data.length !== png2.data.length) {
        return true;
    }
    for (let i = 0; i < png1.data.length; i++) {
        if (png1.data[i] !== png2.data[i]) {
            return true;
        }
    }
    return false;
}

async function generateScreenshot(parkfile: string, outputDir: string, meta: Partial<ParkMetaData>): Promise<void> {
    const screenshotPath = path.join(outputDir, `${baseParkName(parkfile)}.png`);
    const screenshotOptions: ScreenshotOptions = {
        type: 'cropped',
        width: 640,
        height: 360,
        rotation: 0,
        zoom: 2
    }
    if (meta.thumbnail) {
        screenshotOptions.rotation = `${meta.thumbnail.rotation}`;
        screenshotOptions.zoom = `${meta.thumbnail.zoom}`;
        screenshotOptions.x = `${meta.thumbnail.x}`;
        screenshotOptions.y = `${meta.thumbnail.y}`;
        screenshotOptions.z = '24';
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
    if (await isScreenshotNew(screenshotPath, await response.arrayBuffer())) {
        await fsp.writeFile(screenshotPath, response.body);
    }
}

const parkfiles = (await fsp.readdir(PARKSDIR, { withFileTypes: true })).filter(f => f.isFile()).map(f => path.join(PARKSDIR, f.name));
const metadata: Partial<ParkMetaData>[] = [];

for (const parkfile of parkfiles) {
    const meta: Partial<ParkMetaData> = await readParkFile(parkfile);
    meta.baseParkName = baseParkName(parkfile);
    meta.prettyParkName = meta.prettyParkName || prettyParkName(parkfile);
    meta.source = getSourceGame(meta.prettyParkName);
    await generateScreenshot(parkfile, SCREENSHOTDIR, meta);
    metadata.push(meta);
}

await fsp.writeFile(METADATAFILE, JSON.stringify({ parks: metadata }, null, 2), 'utf-8');
