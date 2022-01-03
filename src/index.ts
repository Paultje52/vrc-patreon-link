import { User } from "discord.js";
import DiscordClient from "./DiscordClient";
import VrChatUploader from "./vrChatUploader";

// Startup
console.log("Starting VRC-Patreon-Link...");

// Check process environment variables
require("dotenv").config();
if (!process.env.DISCORD_TOKEN) throw new Error("DISCORD_TOKEN in .env file is not set!");
if (!process.env.GUILD_ID) throw new Error("GUILD_ID in .env file is not set!");
if (!process.env.ROLE_ID) throw new Error("ROLE_ID in .env file is not set!");

if (!process.env.VR_CHAT_USERNAME) throw new Error("VR_CHAT_USERNAME in .env file is not set!");
if (!process.env.VR_CHAT_PASSWORD) throw new Error("VR_CHAT_PASSWORD in .env file is not set!");
if (!process.env.VR_CHAT_AVATARID) throw new Error("VR_CHAT_AVATARID in .env file is not set!");

// Construct client
let client = new DiscordClient({
  token: process.env.DISCORD_TOKEN,
  guild: process.env.GUILD_ID,
  role: process.env.ROLE_ID
});

let vrChatUploader = new VrChatUploader({
  username: process.env.VRCHAT_USERNAME,
  password: process.env.VRCHAT_PASSWORD,
  avatarId: process.env.VRCHAT_AVATAR_ID
});

// Log when the client is ready!
client.on("ready", async () => {

  console.log(`Hello, I'm logged in as ${client.user.tag}!`);
  updatePatrons(await client.fetchPatrons());
});

client.on("guildMemberUpdate", async () => {
  updatePatrons(await client.fetchPatrons());
});

function updatePatrons(patrons: Array<User>) {
  
}