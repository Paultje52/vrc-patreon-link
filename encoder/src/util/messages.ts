import { MessageEmbed } from "discord.js";

let _parseInput = (input: string) => {
  return input.split("\`").join("");
}

let dmsClosedEmbed = new MessageEmbed()
  .setTitle("DMs are closed")
  .setColor("#EB459E")
  .setDescription("The bot is currently unable to send you a DM. Please open your DMs (temporarily) and click the button below to start the VRChat link!.");

let stillDmsClosedEmbed = new MessageEmbed()
    .setTitle("DMs are still closed!")
    .setColor("#EB459E")
    .setDescription(`The bot is still unable to send you a DM. Please open your DMs (temporarily) and click the button again to start the VRChat link!`);

let welcomeMessageEmbed = new MessageEmbed()
  .setTitle("Welcome!")
  .setColor("#5865F2")
  .setDescription(`Thanks for becoming a patron! In order to give you proper rewards inside the world, we'll need a link to your VRChat profile.\nPlease click the button below to get started with the setup!`);

let addVrChatLinkEmbed = new MessageEmbed()
  .setTitle("Setup your profile")
  .setColor("#57F287")
  .setDescription("To setup your profile, please send your VRChat profile link below.")

let acceptProfileEmbed = (username: string) => {
  return new MessageEmbed()
    .setTitle("Profile updated!")
    .setColor("#57F287")
    .setDescription(`Your VRChat profile link has been updated. Welcome, **${_parseInput(username)}**!\n> To change your VRChat profile link, click the button below.`)
    .setFooter({
      text: "It can take up to five minutes for the changes to take effect."
    });
}

let denyProfileTryAgainEmbed = new MessageEmbed()
  .setTitle("Denied profile")
  .setColor("#ED4245")
  .setDescription("You denied the profile link. Please send your profile link again.");

let invalidLinkEmbed = (invalidLink: string) => {
  return new MessageEmbed()
    .setTitle("Invalid profile link")
    .setColor("#ED4245")
    .setDescription(`The link you provided, \`${_parseInput(invalidLink)}\`, is invalid. Please send your full VRChat profile link.\n> Example: \`https://vrchat.com/home/user/usr_3a5bf7e4-e569-41d5-b70a-31304fd8e0e8\`.`);
}

let invalidUseridEmbed = (invalidUserid: string) => {
  return new MessageEmbed()
    .setTitle("Invalid VRChat user")
    .setColor("#ED4245")
    .setDescription(`We could not find an user with the userID \`${_parseInput(invalidUserid)}\`.\nPlease make sure you are sending the correct profile link. If this issue persists, please contact an admin.`);
}

let confirmUser = (username: string, profilePicture: string, userId: string) => {
  return new MessageEmbed()
    .setTitle("Confirm your profile")
    .setColor("#FEE75C")
    .setDescription(`Please confirm your VRChat profile to complete the link!\n**Username:** \`${_parseInput(username)}\``)
    .setThumbnail(profilePicture)
    .setFooter({
      text: userId
    });
}

let removedLinkEmbed = new MessageEmbed()
  .setTitle("Profile link removed")
  .setColor("#ED4245")
  .setDescription("Your VRChat profile link has been removed! To add it again, click the button below.");

let adminPanelEmbed = (msg?: string) => {
  return new MessageEmbed()
    .setTitle("Admin control")
    .setColor("#5865F2")
    .setDescription(`${msg ? `\`\`\`${msg}\`\`\`` : ""}To control the bot, please click the button below.\n> _Everyone who can see this message can control the bot!_`);
}
let adminPanelLoadingEmbed = new MessageEmbed()
  .setTitle("Admin control")
  .setColor("#5865F2")
  .setDescription("Loading...");


export {
  dmsClosedEmbed,
  stillDmsClosedEmbed,
  
  welcomeMessageEmbed,
  addVrChatLinkEmbed,
  removedLinkEmbed,

  denyProfileTryAgainEmbed,
  acceptProfileEmbed,

  invalidLinkEmbed,
  invalidUseridEmbed,
  confirmUser,

  adminPanelEmbed,
  adminPanelLoadingEmbed
}