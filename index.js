import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'node:child_process';
import { WgConfig, getConfigObjectFromFile } from 'wireguard-tools'
import settings from './settings.json' with { type: 'json' };
import { getAddresses } from './domains.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '/configs', `/${settings.config}`);
const outputPath = path.join(__dirname, '/generatedconfig', '/whitelist.conf');
const wiresockDir = path.join(__dirname, '/wiresock');
// const addressesDir = path.join(__dirname, '/addresses');

(async function() {
    // if (!fs.existsSync(addressesDir)) fs.mkdirSync(addressesDir);

    let addresses = await getAddressesFromDomains(settings.domains);

    console.log(addresses);

    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath));
    if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath));

    let config = await getConfigObjectFromFile({ filePath });

    if (settings.dns) config.wgInterface.dns = settings.dns;

    config.peers[0].allowedIps = addresses;

    const configInstance = new WgConfig({
        ...config,
        filePath: outputPath
    })

    await configInstance.writeToFile();

    if (!fs.existsSync(wiresockDir)) fs.mkdirSync(wiresockDir);

    exec("wiresock-client run -config ../generatedconfig/whitelist.conf", {
        cwd: wiresockDir
    }, function (error, stdout, stderr) {
        console.log("Wiresock: " + stdout);
        if (stderr) console.error('stderr', stderr);
        if (error !== null) console.log('exec error: ', error);
    });
})();

async function getAddressesFromDomains(domains) {
    let addresses = [];
    await Promise.all(domains.map(domain => {
        return new Promise(async resolve => {
            addresses.push(...(await getAddresses(domain)));
            resolve();
        });
    }));
    return addresses;
}