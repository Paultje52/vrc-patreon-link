import { MessageButton } from "discord.js";

const buttonIds = {
  addLinkId: "add-link",
  addLinkSetverId: "add-link-srv",
  removeLinkId: "remove-link",

  addProfileYesId: "add-profile-yes",
  addProfileNoId: "add-profile-no",
}

let addLink = new MessageButton()
  .setCustomId(buttonIds.addLinkId)
  .setLabel("Add link")
  .setEmoji("🔗")
  .setStyle("PRIMARY");

let addLinkServer = new MessageButton()
  .setCustomId(buttonIds.addLinkSetverId)
  .setLabel("Add link")
  .setEmoji("🔗")
  .setStyle("PRIMARY");

let removeLink = new MessageButton()
  .setCustomId(buttonIds.removeLinkId)
  .setLabel("Remove link")
  .setEmoji("❌")
  .setStyle("SECONDARY")

let addProfileYes = new MessageButton()
  .setCustomId(buttonIds.addProfileYesId)
  .setLabel("Yes")
  .setEmoji("✔️")
  .setStyle("SUCCESS");

let addProfileNo = new MessageButton()
  .setCustomId(buttonIds.addProfileNoId)
  .setLabel("No")
  .setEmoji("✖️")
  .setStyle("DANGER");

export {
  addLink,
  addLinkServer,
  removeLink,

  addProfileYes,
  addProfileNo,

  buttonIds
}