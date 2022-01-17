import { MessageEmbed } from "discord.js";

let _parseInput = (input: string) => {
  return input.split("\`").join("");
}

let dmsClosedEmbed = new MessageEmbed()
  .setTitle("DMs are closed")
  .setColor("#EB459E")
  .setDescription("The patreon bot is currently unable to send you a DM. Please open your DMs (temporarily) and click the button below to start linking your account!.");

let stillDmsClosedEmbed = new MessageEmbed()
    .setTitle("DMs are still closed!")
    .setColor("#EB459E")
    .setDescription(`The bot is still unable to send you a DM. Please open your DMs (temporarily) and click the button again to start linking your VRChat account!`);

let welcomeMessageEmbed = new MessageEmbed()
  .setTitle("Welcome!")
  .setColor("#5865F2")
  .setDescription(`Thanks for becoming a patron! In order to give you proper rewards inside the world, we'll need a link to your VRChat profile.\nPlease click the button below to get started with the setup!`)
  .setFooter({
    text: "Cannot see the button? Update your Discord client!"
  });

let addVrChatLinkEmbed = new MessageEmbed()
  .setTitle("Setup your profile")
  .setColor("#57F287")
  .setDescription("To setup your profile, please paste your VRChat profile URL below.\n> Want help? Look [here](https://docs.google.com/document/d/19o0WiEGXCdBuMgOXHpb4brQJs8-0boYlWiZHtLc1i2M/edit)!")

let acceptProfileEmbed = (username: string) => {
  return new MessageEmbed()
    .setTitle("Profile updated!")
    .setColor("#57F287")
    .setDescription(`Your VRChat profile URL has been updated. Welcome, **${_parseInput(username)}**!\n_Please note that you'll have to restart your VRChat client for any changes to take effect._\n> To change your VRChat profile URL, click the button below.`)
    .setFooter({
      text: "It can take up to five minutes for changes to take effect."
    });
}

let denyProfileTryAgainEmbed = new MessageEmbed()
  .setTitle("Link Cancelled")
  .setColor("#ED4245")
  .setDescription("Please send your profile URL again.");

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
    .setDescription(`We could not find a user with the userID \`${_parseInput(invalidUserid)}\`.\nPlease make sure you are sending the correct profile link. If this issue persists, please contact an admin.`);
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
  .setDescription("Your VRChat profile URL has been removed! To add it again, click the button below.");

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

let adminSendGetUserEmbed = new MessageEmbed()
  .setTitle("Specify User")
  .setColor("#FEE75C")
  .setDescription("Please send the Discord User ID of the target user.\nNeed help? Look [here](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-).\n> Click the button below to cancel.");
let adminGetUserCancelledEmbed = new MessageEmbed()
  .setTitle("Cancelled!")
  .setColor("#ED4245")
  .setDescription("The action has been cancelled.");
let adminGetUserInvalidUserEmbed = (invalidUser: string) => {
  return new MessageEmbed()
    .setTitle("Invalid user")
    .setColor("#ED4245")
    .setDescription(`The user \`${_parseInput(invalidUser)}\` could not be found. Try again by clicking the button.`);
}
let adminSendOverrideUserEmbed = (username: string) => {
  return new MessageEmbed()
    .setTitle("Override user")
    .setColor("#EB459E")
    .setDescription(`Please send the VRChat URL to link with to the user \`${_parseInput(username)}\`.\n> Click the button below to cancel.`);
}

let adminConfirmForceUploadEmbed = new MessageEmbed()
  .setTitle("Force uploaded!")
  .setColor("#57F287")
  .setDescription("The image data has been succesfully reuploaded.");

let adminConfirmResetEmbed = (username: string) => {
  return new MessageEmbed()
    .setTitle("Reset user")
    .setColor("#57F287")
    .setDescription(`User \`${_parseInput(username)}\` link state cleared! If the user still has a patreon role, the user will get invited again within the next few seconds.`);
}

let adminConfirmOverrideEmbed = (discordUsername: string, vrChatUsername: string) => {
  return new MessageEmbed()
    .setTitle("Reset user")
    .setColor("#57F287")
    .setDescription(`User \`${_parseInput(discordUsername)}\` is now linked to \`${_parseInput(vrChatUsername)}\`!`);
}

let adminResetToPatronEmbed = new MessageEmbed()
  .setTitle("Link reset")
  .setColor("#EB459E")
  .setDescription("Your VRChat profile URL was reset by an admin. If you are still a Patron, you should recieve a new link message soon!");

let adminOverrideToPatronEmbed = (vrChatUsername: string, vrChatProfileUrl: string, vrChatId: string) => {
  return new MessageEmbed()
    .setTitle("Link replaced")
    .setColor("#EB459E")
    .setThumbnail(vrChatProfileUrl)
    .setDescription(`An admin replaced your VRChat profile URL.\nUsername: **${_parseInput(vrChatUsername)}**\n> To remove this link, click the button below.`)
    .setFooter({
      text: vrChatId
    });
}

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
  adminPanelLoadingEmbed,

  adminSendGetUserEmbed,
  adminGetUserCancelledEmbed,
  adminGetUserInvalidUserEmbed,
  adminSendOverrideUserEmbed,

  adminConfirmForceUploadEmbed,
  adminConfirmResetEmbed,
  adminConfirmOverrideEmbed,

  adminResetToPatronEmbed,
  adminOverrideToPatronEmbed
}