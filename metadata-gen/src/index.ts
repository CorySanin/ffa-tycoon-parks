import sharp from 'sharp';
import * as fsp from 'node:fs/promises';
import path from 'path';
import ky from 'ky';
import type { OutputInfo } from 'sharp';

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

async function generateScreenshot(parkfile: string, outputDir: string): Promise<OutputInfo> {
    const screenshotPath = path.join(outputDir, `${baseParkName(parkfile)}.png`);
    const zoom = 2;
    const body = new FormData();
    const width = 640;
    const height = 360;
    body.append('park', new Blob([await fsp.readFile(parkfile)], { type: 'application/octet-stream' }));
    const response = await ky.post(`${SCREENSHOTTERURL}/upload?zoom=${zoom}`, {
        body
    });
    if (!response.ok || !response.body) {
        throw new Error(`Failed to generate screenshot for ${parkfile}: ${response.statusText}`);
    }
    const s = sharp(await response.arrayBuffer());
    const imgMetadata = await s.metadata();
    if (!imgMetadata || !imgMetadata.width || !imgMetadata.height) {
        throw new Error(`Failed to extract metadata for incoming screenshot`);
    }
    if (imgMetadata.width < width || imgMetadata.height < height) {
        s.resize(width, height);
    }
    else {
        s.extract({ left: Math.floor(imgMetadata.width / 2) - (width / 2), top: Math.floor(imgMetadata.height / 2) - (height / 2), width, height })
    }
    return s.png().toFile(screenshotPath);
}

async function generateMetaData(parkfile: string): Promise<Partial<ParkMetaData>> {
    return {
        baseParkName: baseParkName(parkfile),
        prettyParkName: prettyParkName(parkfile)
    };
}

const parkfiles = (await fsp.readdir(PARKSDIR, { withFileTypes: true })).filter(f => f.isFile()).map(f => path.join(PARKSDIR, f.name));
const metadata: Partial<ParkMetaData>[] = [];

for (const parkfile of parkfiles) {
    // await generateScreenshot(parkfile, SCREENSHOTDIR);
    metadata.push(await generateMetaData(parkfile));
}

await fsp.writeFile(METADATAFILE, JSON.stringify({parks: metadata}, null, 2), 'utf-8');
