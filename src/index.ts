import DiscordClient from "./DiscordClient";

console.log("Starting VRC-Patreon-Link...");
require("dotenv").config();

if (!process.env.DISCORD_TOKEN) throw new Error("DISCORD_TOKEN in .env file is not set!");
let client = new DiscordClient(process.env.DISCORD_TOKEN);

client.on("ready", async () => {

  console.log(`Hello, I'm logged in as ${client.user.tag}!`);

});