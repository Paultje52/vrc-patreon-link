# VRC-Patreon-Link Encoder

> Automatically manages and handles Discord role / VRChat integration. Commonly used to dynamically display patrons inside a world.

- [Main](../README.md)
- Encoder
- [Parser](../parser/README.md)

## Encoder

This is a Discord Bot that sends everyone in a server with a role a message to link their VRChat account to the bot. The bot will update a txt file on Github Pages in a VRC-friendly way.<br>
This system is written in [TypeScript](https://www.typescriptlang.org/) and compiles to JavaScript ([NodeJS](http://nodejs.org/) code). The encoder uses a MySQL (or MariaDB) database with [Prisma](https://www.prisma.io/).

## Setup

1. Make sure to install [Node.js](https://nodejs.org/en/download/) and [Yarn](https://classic.yarnpkg.com/lang/en/docs/install).
2. Download the latest [release](https://github.com/Paultje52/vrc-patreon-link/releases).
3. Extract the contents of the zip file called `VRC-Patreon-Link`.
4. Install the NPM packages by running `yarn` in the main directory.
5. Install PM2 by running `yarn global add pm2`.
6. Start the linker by running `pm2 start src/index.js`.
   > Make sure you changed the variables in [.env](#env)

## .env

The whole config can be changed in the [.env](.env) file. Rename `.env.example` to `.env` to get started. Open the `.env` file and read the comments to fill it in.
