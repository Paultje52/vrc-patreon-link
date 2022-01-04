import { ButtonInteraction, MessageActionRow, MessageButton, MessageEmbed, User } from "discord.js";
import DiscordClient from "./DiscordClient";
import VrChatUploader from "./vrChatUploader";
import * as Keyv from "keyv";
import imageEncoder from "./imageEncoder/imageEncoder";
import { writeFile } from "fs/promises";
import { join } from "path";
import { parser } from "html-metadata-parser";

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

// Create database
let database = new Keyv("sqlite://patreons.sqlite");

// Construct client
let client = new DiscordClient({
  token: process.env.DISCORD_TOKEN,
  guild: process.env.GUILD_ID,
  role: process.env.ROLE_ID
});

let vrChatUploader = new VrChatUploader({
  username: process.env.VR_CHAT_USERNAME,
  password: process.env.VR_CHAT_PASSWORD,
  avatarId: process.env.VR_CHAT_AVATARID
});

// Log when the client is ready!
client.on("ready", async () => {
  console.log(`Hello, I'm logged in as ${client.user.tag}!`);
  updatePatrons(await client.fetchPatrons());
});

client.on("guildMemberUpdate", async () => {
  updatePatrons(await client.fetchPatrons());
});

async function updatePatrons(patrons: Array<User>) {
  
  for (let user of patrons) {
    let databaseResult = await database.get(user.id);
    if (databaseResult !== undefined) continue;

    // Send a message to the new user!
    inviteNewPatron(user);
  }

}

async function inviteNewPatron(user: User) {
  let embed = new MessageEmbed()
    .setTitle("Welcome!")
    .setDescription(`Thanks for becoming a patron! In order to give you proper rewards inside the world, we'll need a link to your VRChat profile.\nPlease click the button below to get started with the setup!`);

  user.send({
    embeds: [ embed ],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("add-link")
          .setLabel("Add link")
          .setEmoji("🔗")
          .setStyle("PRIMARY")
      )
    ]
  })
    .catch(async () => {
      // Cannot send to the user directly, sending in the patreon notify channel
      let guild = client.guilds.cache.get(process.env.GUILD_ID);
      if (!guild) throw new Error(`Guild ${process.env.GUILD_ID} not found!`);

      let channel = await guild.channels.fetch(process.env.PATREON_CHANNEL);
      if (!channel || !channel.isText()) throw new Error(`Channel ${process.env.PATREON_CHANNEL} not found!`);

      let msg = await channel.send({
        content: `<@${user.id}>\n> _Note: Allow me to send you private messages before clicking the button!_`,
        allowedMentions: {
          users: [user.id]
        },

        embeds: [ embed ],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setCustomId("add-link-srv")
              .setLabel("Add link")
              .setEmoji("🔗")
              .setStyle("PRIMARY")
          )
        ]
      });
      database.set(msg.id, user.id);

    });

  // Save the user to the database
  await database.set(user.id, false);
  addUser(user.id);
}

let users: string[];
(async () => {
  users = (await database.get("users")) || [];
})();

async function addUser(id: string) {
  users.push(id);
  await database.set("users", users);
}

client.on("messageCreate", async (message) => {
  if (message.guild !== null || message.channel.type !== "DM") return;

  let databaseResult = await database.get(message.author.id);
  if (databaseResult !== true) return;

  let userRegex = /(?:usr_)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gm;
  let matches = message.content.match(userRegex);
  if (!matches) {
    message.reply({
      embeds: [new MessageEmbed()
        .setTitle("Invalid profile link")
        .setDescription("Please send your full VRChat profile link.")
      ]
    });
    return;
  }

  await database.set(message.author.id, matches[0]);
  message.reply({
    embeds: [new MessageEmbed()
      .setTitle("Profile saved!")
      .setDescription("Your VRChat profile link has been saved! To remove it, click the button below.")
    ],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("remove-link")
          .setLabel("Remove link")
          .setEmoji("❌")
          .setStyle("SECONDARY")
      )
    ]
  });

  updateUsers();

});

let isUpdating = false;
async function updateUsers() {
  while (isUpdating) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  isUpdating = true;
  let ranks = {};
  
  let guild = client.guilds.cache.get(client.guildId);
  if (!guild) throw new Error(`Guild ${client.guildId} not found!`);

  let members = await guild.members.fetch()
    .catch(console.error);

  if (!members) {
    console.warn("Couldn't fetch members!");
    return [];
  }

  let roles: string[] = [];
  for (let roleId of client.roleIds) {
    let role = await guild.roles.fetch(roleId);

    if (!role) console.warn(`Role ${roleId} not found!`);
    else roles.push(role.id);
  }

  for (let member of Array.from(members.values())) {
    let vrChatId = await database.get(member.id);
    if (typeof vrChatId !== "string") continue;
   
    let res: any = await parser(`https://vrchat.com/home/user/${vrChatId}`);
    let username;
    if (res && res.og && res.og.title) username = res.og.title;
    else username = vrChatId;

    for (let role of roles) {

      if (member.roles.cache.has(role)) {

        if (!ranks[role]) ranks[role] = [ guild.roles.cache.get(role).name ];
        ranks[role].push(username);
        break;
      }
    }

  }

  let ranksExport = [];
  for (let roleId in ranks) {
    ranksExport.push(`${ranks[roleId].join(".")}`);
  }

  console.log(ranksExport.join("\n"));

  let img = imageEncoder(ranksExport.join("\n"));
  let path = join(__dirname, "ranks.png");
  await writeFile(path, img);

  let res = await vrChatUploader.upload(path);
  if (!res) console.warn("Couldn't upload ranks!");

  isUpdating = false;
  console.log("Updated ranks!");

}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  
  let buttonInteraction = <ButtonInteraction> interaction;
  if (buttonInteraction.customId === "remove-link") {

    database.set(interaction.user.id, false);
    buttonInteraction.deferUpdate();

    interaction.user.send({
      embeds: [new MessageEmbed()
        .setTitle("Profile removed!")
        .setDescription("Your VRChat profile link has been removed! To add it again, click the button below.")
      ],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId("add-link")
            .setLabel("Add link")
            .setEmoji("🔗")
            .setStyle("PRIMARY")
        )
      ]
    });

  } else if (buttonInteraction.customId === "add-link") {

    database.set(interaction.user.id, true);
    buttonInteraction.deferUpdate();

    interaction.user.send({
      embeds: [new MessageEmbed()
        .setTitle("Setup your profile")
        .setDescription("To setup your profile, please send your VRChat profile link below.")
      ]
    });

  } else if (buttonInteraction.customId === "add-link-srv") {

    let userId = await database.get(interaction.message.id);
    if (interaction.user.id !== userId) return;

    buttonInteraction.deferUpdate();
    
    let guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) throw new Error(`Guild ${process.env.GUILD_ID} not found!`);

    let channel = await guild.channels.fetch(process.env.PATREON_CHANNEL);
    if (!channel) throw new Error(`Channel ${process.env.PATREON_CHANNEL} not found!`);

    let member = await guild.members.fetch(userId);
    
    member.send({
      embeds: [new MessageEmbed()
        .setTitle("Setup your profile")
        .setDescription("To setup your profile, please send your VRChat profile link below.")
      ]
    }).catch(() => {
      if (!channel.isText()) return;
      channel.send(`<@${userId}>, I cannot send a message to you. Please allow me to send messages to you and try again.`);
      return;
    });

    database.set(interaction.user.id, true);
    database.delete(interaction.message.id);

  }

});

/*
  DATABASE FORMAT - VALUE OF USER.ID
  undefined - nothing
  false - disabled
  true - has been sent a message
  <USER_ID> (String) - VRChat profile ID
*/

// TODO: Send the VRChat usernames to the avatar