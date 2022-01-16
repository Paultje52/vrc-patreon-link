import { MessageButton } from "discord.js";

const buttonIds = {
  addLinkId: "add-link",
  addLinkSetverId: "add-link-srv",
  removeLinkId: "remove-link",

  addProfileYesId: "add-profile-yes",
  addProfileNoId: "add-profile-no",

  adminPanelIds: {
    restartId: "restart",
    forceUploadId: "force-upload",
    exportListId: "export-list",
    resetSpecifiedUserId: "reset-specified-user",
    overrideSpecifiedUserId: "override-specified-user"
  }
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

let adminPanelButtons = {
  restart: new MessageButton()
    .setCustomId(buttonIds.adminPanelIds.restartId)
    .setLabel("Restart")
    .setEmoji("🔌")
    .setStyle("DANGER"),
  
  forceUpload: new MessageButton()
    .setCustomId(buttonIds.adminPanelIds.forceUploadId)
    .setLabel("Force upload")
    .setEmoji("📤")
    .setStyle("PRIMARY"),

  exportList: new MessageButton()
    .setCustomId(buttonIds.adminPanelIds.exportListId)
    .setLabel("Export list")
    .setEmoji("📄")
    .setStyle("PRIMARY"),

  resetSpecifiedUser: new MessageButton()
    .setCustomId(buttonIds.adminPanelIds.resetSpecifiedUserId)
    .setLabel("Reset specified user")
    .setEmoji("🗑️")
    .setStyle("SECONDARY"),

  overrideSpecifiedUser: new MessageButton()
    .setCustomId(buttonIds.adminPanelIds.overrideSpecifiedUserId)
    .setLabel("Override specified user")
    .setEmoji("🔗")
    .setStyle("SECONDARY")
}

export {
  addLink,
  addLinkServer,
  removeLink,

  addProfileYes,
  addProfileNo,

  adminPanelButtons,
  buttonIds
}