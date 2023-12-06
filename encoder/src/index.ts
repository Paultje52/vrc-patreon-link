// "Starting" log
console.log("Starting...");

import AdminPanel from "./AdminPanel";
// Importing dependencies
import DiscordClient from "./client/DiscordClient";
import GithubClient from "./client/GithubClient";
import VRChatClient from "./client/VRChatClient";

// Environment variables
import "./util/checkenv";
import ensureInvites from "./util/ensureInvites";

// Creating the clients
const client = new DiscordClient();
const vrChatClient = new VRChatClient();
const githubClient = new GithubClient();

// Discord client configuration
client.setVRChatClient(vrChatClient);
client.setGithubClient(githubClient);
client.login(process.env.DISCORD_TOKEN);

// Create admin panel
const adminPanel = new AdminPanel(client, vrChatClient);

// When the client is ready
client.on("ready", async () => {
  console.log(`VRC Patreon Link logged in as ${client.user?.tag}!`);
  // Fetch all users with a role
  const users = await client.fetchUsers();
  client.setAllUsers(users);

  // Bot status update
  client.updatePresence();
  setInterval(() => {
    client.updatePresence();
  }, 1000 * 60 * 5);

  // Admin panel
  await adminPanel.initialize();

  // We're ready!
  console.log("VRC Patreon Link is ready!");
  ensureInvites(client);

  // Update patreons every 5 minutes - 5 seconds after startup
  setTimeout(() => {
    client.updatePatreons();
  }, 5000);
  setInterval(() => {
    client.updatePatreons();
  }, 1000 * 60 * 5);
});

client.on("guildMemberUpdate", async () => {
  const users = await client.fetchUsers();
  client.setAllUsers(users);
  ensureInvites(client);
});

client.on("interactionCreate", (interaction) => {
  // If the user clicks on a button in the DMs
  if (interaction.isButton() && interaction.customId.startsWith("USER_")) {
    const user = client.getAllUsers().get(interaction.user.id);
    if (user) user.buttonInteraction(interaction);
  }

  // If the user clicks on a button in the AdminPanel
  if (interaction.isButton() && interaction.customId.startsWith("ADMIN_")) {
    adminPanel.buttonInteraction(interaction);
  }
  // If an AdminPanel modal is submitted
  if (interaction.isModalSubmit() && interaction.customId.startsWith("ADMIN_")) {
    adminPanel.modalInteraction(interaction);
  }

  // If a user clicks on the reset link state in a DMs closed message
  if (interaction.isButton() && interaction.customId.startsWith("DM_CLOSED_")) {
    const user = client.getAllUsers().get(interaction.customId.split("DM_CLOSED_")[1]);
    if (!user || user.getDiscordMember().id !== interaction.member?.user.id) return;

    interaction.deferUpdate();
    console.log(`Inviting ${user.getDiscordMember().displayName} (${user.getDiscordMember().id})...`);
    user.invite();
  }
});

client.on("messageCreate", (message) => {
  // If the user sends a message in the DMs to the bot
  if (message.channel.isDMBased()) {
    const user = client.getAllUsers().get(message.author.id);
    if (user) user.messageInteraction(message);
  }
});