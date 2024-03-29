import DiscordClient from "./discord/DiscordClient";
import Keyv from "keyv";
import PatronInviter from "./patreon/PatronInviter";
import PatronUpdater from "./patreon/PatronUpdater";
import VrChat from "./vrchat/VrChat";
import checkEnvironmentVariables from "./util/checkEnvironmentVariables";
import Logger from "./util/Logger";
import AdminPanel from "./util/AdminPanel";

// Startup log
console.log("Starting VRC-Patreon-Link...");

// Check process environment variables
checkEnvironmentVariables();

// Creating the logger
let logger = new Logger({
  enabled: process.env.LOGGER_ENABLED === "true",
  timezone: <string> process.env.LOGGER_TIMEZONE
});

// Create database
let database = new Keyv("sqlite://patreons.sqlite");

// Construct classes
let client = new DiscordClient({
  token: <string> process.env.DISCORD_TOKEN,
  guild: <string> process.env.GUILD_ID,
  roles: <string> process.env.ROLE_ID,
  channel: <string> process.env.PATREON_CHANNEL
});
let vrChat = new VrChat(process.env.VR_CHAT_AVATARID.split("."), {
  username: <string> process.env.VR_CHAT_USERNAME,
  password: <string> process.env.VR_CHAT_PASSWORD
});
let patronUpdater = new PatronUpdater(client, database, vrChat); // The patron updater is responsible for updating the patrons
let patronInviter = new PatronInviter(client, database, vrChat); // If a new patron is found, the patron inviter is responsible for inviting them, including handling message buttons 
let adminPanel = new AdminPanel(client, patronUpdater, patronInviter, logger, vrChat, database); // The admin panel is responsible for handling the admin commands

// Log when the client is ready!
client.on("ready", async () => {
  console.log(`Hello, I'm logged in as ${client.user.tag}!`);

  adminPanel.start();

  let patronsToInvite = await patronUpdater.updatePatrons();
  if (patronsToInvite.length > 0) {
    console.log(`Sending invites to ${patronsToInvite.length} patron(s)...`);
    patronInviter.inviteNewPatrons(patronsToInvite);
  }
  
  patronUpdater.syncWithVrChat();
});

client.on("guildMemberUpdate", async () => {
  let patronsToInvite = await patronUpdater.updatePatrons();
  if (patronsToInvite.length === 0) return;

  console.log(`Sending invites to ${patronsToInvite.length} patron(s)...`);
  patronInviter.inviteNewPatrons(patronsToInvite);
});

setInterval(() => {
  patronUpdater.syncWithVrChat();
}, 1000*60*5); // Five minute interval