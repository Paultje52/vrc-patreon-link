import { MessageButton } from "discord.js";

let addLink = new MessageButton()
  .setCustomId("add-link")
  .setLabel("Add link")
  .setEmoji("🔗")
  .setStyle("PRIMARY");

let addLinkServer = new MessageButton()
  .setCustomId("add-link-srv")
  .setLabel("Add link")
  .setEmoji("🔗")
  .setStyle("PRIMARY");

let removeLink = new MessageButton()
  .setCustomId("remove-link")
  .setLabel("Remove link")
  .setEmoji("❌")
  .setStyle("SECONDARY")

export {
  addLink,
  addLinkServer,
  removeLink
}