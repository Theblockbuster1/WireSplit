import axios from 'axios';
import { firefox } from 'playwright';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import settings from './settings.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getDomains(domain, defaulttimeout=5000) {
    let timeout = 0;
    let timer;

    const browser = await firefox.launch();
    const page = await browser.newPage();
    await page.goto('https://' + domain);
    
    let domains = new Set();

    domains.add(domain);

    page.on('request', request => {
        let { host } = request.headers();
        console.log(`${domain} >> ${host}`);

        function checkhost(host) {
            if (!domains.has(host)) { // If new domain found
                timeout = Date.now() + defaulttimeout;
                domains.add(host);
            }
        }

        checkhost(host);

        let currentRequest = request;
        while (currentRequest.redirectedFrom()) {
            currentRequest = currentRequest.redirectedFrom();
            host = currentRequest.host;
            console.log(`${domain} >> ${host}`);
            checkhost(host);
        }
    });

    await new Promise((resolve) => {
        page.waitForLoadState('domcontentloaded').then(() => {
            console.log(`${domain} >> Page Loaded.`);
            timeout = Date.now() + defaulttimeout;
            timer = setInterval(() => {
                if (Date.now() >= timeout) {
                    console.log(`${domain} >> Been ${defaulttimeout/1000} seconds since last new request, mission complete.`);
                    resolve();
                }
            }, 1000);
        });
    });

    await browser.close();

    clearInterval(timer);

    return domains;
}

export async function getBlockedDomains(url='https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts') {
    let res = await axios.get(url);
    return res.data.split(/\r?\n/).filter(line => line.startsWith('0.0.0.0') && !line.endsWith('0.0.0.0')).map(line => line.split(' ')[1]);
}

export async function getCustomBlockedDomains(filename='custom_filter.txt') {
    let data = await fs.readFile(path.resolve(__dirname, filename), 'utf8');
    return data.split(/\r?\n/);
}

export function filterDomains(domains, blockedDomains) {
    blockedDomains.forEach(domain => {
        domains.delete(domain);
    });
    return domains;
}

export async function getAddressesDNS(domains) {
    let addressesAll = new Set();

    const lookups = Array.from(domains).map(domain => {
        return new Promise((resolve, reject) => {
            dns.lookup(domain, { family: 0, all: true, hints: dns.ALL }, (err, addresses) => {
                if (err) {
                    return reject(err);
                }
                addresses.forEach(a => {
                    if (a.family === 4 || settings.ipv6) addressesAll.add(a.address + (a.family === 4 ? '/32' : '/128'));
                });
                resolve();
            });
        });
    });

    await Promise.all(lookups);

    return addressesAll;
}

export async function getAddresses(domain) {
    let domains = await getDomains(domain);

    let filtered = filterDomains(filterDomains(
        domains,
        await getBlockedDomains()),
        await getCustomBlockedDomains());

    return await getAddressesDNS(filtered);
}