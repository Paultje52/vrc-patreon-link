import DiscordClient from "./DiscordClient";
import * as Keyv from "keyv";
import PatronInviter from "./PatronInviter";
import PatronUpdater from "./PatronUpdater";
import VrChat from "./VrChat";
import checkEnvironmentVariables from "./util/checkEnvironmentVariables";
import Logger from "./util/Logger";

// Startup log
console.log("Starting VRC-Patreon-Link...");

// Check process environment variables
checkEnvironmentVariables();

// Creating the logger
new Logger({
  enabled: process.env.LOGGER_ENABLED === "true",
  timezone: process.env.LOGGER_TIMEZONE
});

// Create database
let database = new Keyv("sqlite://patreons.sqlite");

// Construct classes
let client = new DiscordClient({
  token: process.env.DISCORD_TOKEN,
  guild: process.env.GUILD_ID,
  roles: process.env.ROLE_ID,
  channel: process.env.PATREON_CHANNEL
});
let vrChat = new VrChat({
  username: process.env.VR_CHAT_USERNAME,
  password: process.env.VR_CHAT_PASSWORD,
  avatarId: process.env.VR_CHAT_AVATARID
});
let patronUpdater = new PatronUpdater(client, database, vrChat); // The patron updater is responsible for updating the patrons
let patronInviter = new PatronInviter(client, database, vrChat); // If a new patron is found, the patron inviter is responsible for inviting them, including handling message buttons 

// Log when the client is ready!
client.on("ready", async () => {
  console.log(`Hello, I'm logged in as ${client.user.tag}!`);

  let patronsToInvite = await patronUpdater.updatePatrons();
  patronInviter.inviteNewPatrons(patronsToInvite);
  
  patronUpdater.syncWithVrChat();
});

client.on("guildMemberUpdate", async () => {
  let patronsToInvite = await patronUpdater.updatePatrons();
  patronInviter.inviteNewPatrons(patronsToInvite);
});

setInterval(() => {
  patronUpdater.syncWithVrChat();

}, 1000*60*5); // Five minute interval