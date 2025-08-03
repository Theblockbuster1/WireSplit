# WireGuard VPN Split Tunnelling per Website

## Dependancies
- [WireGuard](https://www.wireguard.com/install/)
- [Node.js](https://nodejs.org/en/download) (Developed on v22.14.0)

## Install

1. Clone the repository to your computer
2. Run `npm i` in the repo's directory
3. I actually don't know if that should install headless Firefox for you, so if it doesn't, also run `npx playwright install --with-deps --only-shell`

## Setup

1. Put a WireGuard `.conf` file in the `/configs` directory (create it).
2. In `settings.json`:
    1. Set the `config` value to the file name of the `.conf` file.
    2. Add as many `domains` as you'd like of the websites you'd like to be tunnelled.
    3. Optionally, change the DNS records. These are the DNS records that will be used in WireGuard. I set them to Cloudflare DNS by default.

## Usage

1. Run `node .`!


## To-Do

- GUI
- Caching website's addresses