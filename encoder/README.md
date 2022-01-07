# VRC-Patreon-Link Encoder
> Automatically uploads a list of patrons to VRChat everytime a patron joins or leaves, without reuploading the world. For use with https://github.com/Miner28/AvatarImageReader

- [Main](../README.md)
- Encoder
- [Parser](../parser/README.md)

## Encoder
This is a Discord bot that sends everyone in a server with a role a message to link their VRChat account to the bot. The bot will upload an avatar to VRChat, encoder with every patreon name.<br>
This system is written in [TypeScript](https://www.typescriptlang.org/) and compiles to JavaScript ([NodeJS](http://nodejs.org/) code).

## Setup
0. Make sure to install [Node.js](https://nodejs.org/en/download/).
1. Download the latest [release](https://github.com/Paultje52/vrc-patreon-link/releases).
2. Extract the contents of the zip file called `VRC-Patreon-Link`.
3. Install the NPM packages by running `npm install` in the main directory.
4. Install PM2 by running `npm install -g pm2`.
5. Start the linker by running `pm2 start src/index.js`.
> Make sure you changed the variables in [.env](#env)

## .env
The whole config can be changed in the [.env](.env) file. Rename `.env.example` to `.env` to get started. These are the different options.
### Discord
- `DISCORD_TOKEN`: The discord bot token. Look at [this](https://discordapp.com/developers/applications/me) create a bot and get one.
- `GUILD_ID`: Your Discord Server id. Look [here](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) if you want to know how to find it. 
- `ROLE_ID`: The discord roles ids, separated by a space (`ID1 ID2 ID3`). Find the role ids by going to the role settings in the server, right click on the role and copy the id.
> Note: You have to enable developer mode. Look [here](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) for more information.
- `PATREON_CHANNEL`: The patreon notification channel. When someone doesn't have their DMs open, the bot will send a message here notifying that user. Look [here](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) if you want to know how to find them. 

### VRChat
> You cannot use 2FA for VRChat.
- `VR_CHAT_USERNAME`: The username of the VRChat account.
- `VR_CHAT_PASSWORD`: The password of the VRChat account.
- `VR_CHAT_AVATARID`: The avatarID of the avatar that will be changed to update the patreons.

### Logger
- `LOGGER_ENABLED`: If the logger should be enabled (`true` or `false`).
- `LOGGER_TIMEZONE`: The timezone for the logger messages (Look [here](https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a) for the possible values).