# WireGuard VPN Split Tunnelling per Website

Mac support is currently in development, so not yet fully supported.

## Dependancies
- [WireGuard](https://www.wireguard.com/install/) [module & tools]
- [Node.js](https://nodejs.org/en/download) (Developed on v22.14.0)
- Administrator/Elevated Permissions on your computer

On Mac:

- Run `brew install wireguard-tools` in the terminal.

## Install

1. Clone the repository to your computer
2. Run `npm i` in the repo's directory
3. Run `npx playwright install firefox --with-deps --only-shell` (to install headless Firefox, for getting website addresses)

## Setup

1. Put a WireGuard `.conf` file in the `/configs` directory (create it).
2. In `settings.json`:
    1. Set the `config` value to the file name of the `.conf` file.
    2. Add as many `domains` as you'd like of the websites you'd like to be tunnelled.

## Usage

### Start:

Run `node .` from an elevated terminal!

### To take down the VPN:

Windows: `wireguard /uninstalltunnelservice WireSplit` from an elevated terminal!

Linux / MacOS: `sudo wg-quick down ./generatedconfig/WireSplit.conf`


## To-Do

- GUI
- Caching website's addresses


## Notes

Optionally, you can change the DNS records in `settings.json`. These are the DNS records that will be used in WireGuard. I set them to Cloudflare DNS by default.

If you want to add a domain to `settings.json`, you should probably make sure its not in `custom_filter.txt`. If it is, you can remove it.

This app assumes that you use a decent ad-blocker, because by default it doesn't VPN ad domains.