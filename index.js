import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';
const execAsync = promisify(exec);
import { WgConfig, getConfigObjectFromFile } from 'wireguard-tools'
import settings from './settings.json' with { type: 'json' };
import { getAddresses } from './domains.js';
import readline from 'node:readline';
import { exit } from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '/configs', `/${settings.config}`);
const outputFileName = 'WireSplit.conf';
const genConfigDir = path.join(__dirname, '/generatedconfig');
const outputPath = path.join(genConfigDir, outputFileName);


(async function() {
    let addresses = await getAddressesFromDomains(settings.domains);

    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath));
    if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath));

    let config = await getConfigObjectFromFile({ filePath });

    if (settings.dns) config.wgInterface.dns = settings.dns;

    config.peers[0].allowedIps = addresses;

    const configInstance = new WgConfig({
        ...config,
        filePath: outputPath
    });

    await configInstance.writeToFile();

    console.log("Checking if WireSplit is already up...");
    if (await checkConfig()) {
        console.log("WireSplit found, uninstalling service...");
        exec("wireguard /uninstalltunnelservice WireSplit", { cwd: genConfigDir }, function (_error, _stdout, stderr) {
            if (stderr) {
                console.error("Error uninstalling WireSplit service, maybe turn off WireGuard? Error below:");
                console.error(stderr);
            }
        });

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        await new Promise(resolve => {
            rl.question("Would you like to try to continue and install the service, despite the error? Personally, I don't think it'll work. [y/N]: ", input => {
                switch(input.toLowerCase()) {
                    case "y":
                        break;
                    default:
                        exit(0);
                }
                rl.close();
                resolve();
            });
        });
    }

    console.log("Installing service...");
    exec(`wireguard /installtunnelservice "${outputPath}"`, { cwd: genConfigDir }, function (_error, _stdout, stderr) {
        if (stderr) {
            console.error("Error installing WireSplit service, maybe turn off WireGuard? Error below:");
            console.error(stderr);
        }
    });
    console.log("Success!");

    exec("wg show", function (_, stdout) {
        console.log(stdout);
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

async function checkConfig(conf = 'WireSplit') {
    return await execAsync(`wg showconf ${conf}`).then(() => true).catch(() => false);
}