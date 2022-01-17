const buttons = require("../build/util/buttons.js");
const checkEnvironmentVariables = require("../build/util/checkEnvironmentVariables.js").default;
const messages = require("../build/util/messages.js");
const regex = require("../build/util/regex.js");

let ids = buttons.buttonIds;

describe("Button tests", () => {

  test("buttonIdExports", () => {
    expect(ids.addLinkId).toBe("add-link");
    expect(ids.addLinkSetverId).toBe("add-link-srv");
    expect(ids.removeLinkId).toBe("remove-link");

    expect(ids.addProfileYesId).toBe("add-profile-yes");
    expect(ids.addProfileNoId).toBe("add-profile-no");
    
    expect(ids.adminPanelIds.restartId).toBe("restart");
    expect(ids.adminPanelIds.forceUploadId).toBe("force-upload");
    expect(ids.adminPanelIds.exportListId).toBe("export-list");
    expect(ids.adminPanelIds.resetSpecifiedUserId).toBe("reset-specified-user");
    expect(ids.adminPanelIds.overrideSpecifiedUserId).toBe("override-specified-user");
  });

  test("addLink", () => {
    expect(buttons.addLink.customId).toBe(ids.addLinkId);
  });

  test("addLinkServer", () => {
    expect(buttons.addLinkServer.customId).toBe(ids.addLinkSetverId);
  });

  test("removeLink", () => {
    expect(buttons.removeLink.customId).toBe(ids.removeLinkId);
  });

  test("addProfileYes", () => {
    expect(buttons.addProfileYes.customId).toBe(ids.addProfileYesId);
  });

  test("addProfileNo", () => {
    expect(buttons.addProfileNo.customId).toBe(ids.addProfileNoId);
  });

  test("adminPanelButtons", () => {
    expect(buttons.adminPanelButtons.restart.customId).toBe(ids.adminPanelIds.restartId);
    expect(buttons.adminPanelButtons.forceUpload.customId).toBe(ids.adminPanelIds.forceUploadId);
    expect(buttons.adminPanelButtons.exportList.customId).toBe(ids.adminPanelIds.exportListId);
    expect(buttons.adminPanelButtons.resetSpecifiedUser.customId).toBe(ids.adminPanelIds.resetSpecifiedUserId);
    expect(buttons.adminPanelButtons.overrideSpecifiedUser.customId).toBe(ids.adminPanelIds.overrideSpecifiedUserId);
    expect(buttons.adminPanelButtons.cancel("123").customId).toBe("cancel-123");
  });

});

describe("Check environment variables", () => {
  test("No args", () => {
    expect(checkEnvironmentVariables).toThrow();
  });

  test("Discord args", () => {
    process.env = {
      DISCORD_TOKEN: "token",
      GUILD_ID: "guild",
      ROLE_ID: "role",
      PATREON_CHANNEL: "channel",

      ADMIN_PANEL_CHANNEL: "channel",
      ADMIN_PANEL_MESSAGE_ID: "id"
    };
    expect(checkEnvironmentVariables).toThrow();
  });

  test("Discord and vrchat args", () => {
    process.env = {
      DISCORD_TOKEN: "token",
      GUILD_ID: "guild",
      ROLE_ID: "role",
      PATREON_CHANNEL: "channel",

      ADMIN_PANEL_CHANNEL: "channel",
      ADMIN_PANEL_MESSAGE_ID: "id",

      VR_CHAT_USERNAME: "username",
      VR_CHAT_PASSWORD: "password",
      VR_CHAT_AVATARID: "avatar"
    };
    expect(checkEnvironmentVariables).toThrow();
  });

  test("Discord, vrchat and logger args (Everything)", () => {
    process.env = {
      DISCORD_TOKEN: "token",
      GUILD_ID: "guild",
      ROLE_ID: "role",
      PATREON_CHANNEL: "channel",

      ADMIN_PANEL_CHANNEL: "channel",
      ADMIN_PANEL_MESSAGE_ID: "id",

      VR_CHAT_USERNAME: "username",
      VR_CHAT_PASSWORD: "password",
      VR_CHAT_AVATARID: "avatar",

      LOGGER_ENABLED: "true",
      LOGGER_TIMEZONE: "some_timezone"
    };
    expect(checkEnvironmentVariables()).toBe(undefined);
  });
});

describe("Messages present", () => {

  test("dmsClosedEmbed", () => {
    expect(messages.dmsClosedEmbed).toBeDefined();
    expect(messages.dmsClosedEmbed.color).toBeDefined();
    expect(messages.dmsClosedEmbed.title).toBeDefined();
    expect(messages.dmsClosedEmbed.description).toBeDefined();
  });
  test("stillDmsClosedEmbed", () => {
    expect(messages.stillDmsClosedEmbed).toBeDefined();
    expect(messages.stillDmsClosedEmbed.color).toBeDefined();
    expect(messages.stillDmsClosedEmbed.title).toBeDefined();
    expect(messages.stillDmsClosedEmbed.description).toBeDefined();
  });
  
  test("welcomeMessageEmbed", () => {
    expect(messages.welcomeMessageEmbed).toBeDefined();
    expect(messages.welcomeMessageEmbed.color).toBeDefined();
    expect(messages.welcomeMessageEmbed.title).toBeDefined();
    expect(messages.welcomeMessageEmbed.description).toBeDefined();
  });
  test("addVrChatLinkEmbed", () => {
    expect(messages.addVrChatLinkEmbed).toBeDefined();
    expect(messages.addVrChatLinkEmbed.color).toBeDefined();
    expect(messages.addVrChatLinkEmbed.title).toBeDefined();
    expect(messages.addVrChatLinkEmbed.description).toBeDefined();
  });
  test("removedLinkEmbed", () => {
    expect(messages.removedLinkEmbed).toBeDefined();
    expect(messages.removedLinkEmbed.color).toBeDefined();
    expect(messages.removedLinkEmbed.title).toBeDefined();
    expect(messages.removedLinkEmbed.description).toBeDefined();
  });
  
  test("denyProfileTryAgainEmbed", () => {
    expect(messages.denyProfileTryAgainEmbed).toBeDefined();
    expect(messages.denyProfileTryAgainEmbed.color).toBeDefined();
    expect(messages.denyProfileTryAgainEmbed.title).toBeDefined();
    expect(messages.denyProfileTryAgainEmbed.description).toBeDefined();
  });
  test("acceptProfileEmbed", () => {
    expect(messages.acceptProfileEmbed).toBeDefined();
    expect(messages.acceptProfileEmbed("").color).toBeDefined();
    expect(messages.acceptProfileEmbed("").title).toBeDefined();
    expect(messages.acceptProfileEmbed("").description).toBeDefined();
  });
  
  test("invalidLinkEmbed", () => {
    expect(messages.invalidLinkEmbed).toBeDefined();
    expect(messages.invalidLinkEmbed("").color).toBeDefined();
    expect(messages.invalidLinkEmbed("").title).toBeDefined();
    expect(messages.invalidLinkEmbed("").description).toBeDefined();
  });
  test("invalidUseridEmbed", () => {
    expect(messages.invalidUseridEmbed).toBeDefined();
    expect(messages.invalidUseridEmbed("").color).toBeDefined();
    expect(messages.invalidUseridEmbed("").title).toBeDefined();
    expect(messages.invalidUseridEmbed("").description).toBeDefined();
  });
  test("confirmUser", () => {
    expect(messages.confirmUser).toBeDefined();
    expect(messages.confirmUser("", "", "").color).toBeDefined();
    expect(messages.confirmUser("", "", "").title).toBeDefined();
    expect(messages.confirmUser("", "", "").description).toBeDefined();
  });
  
  test("adminPanelEmbed", () => {
    expect(messages.adminPanelEmbed).toBeDefined();
    expect(messages.adminPanelEmbed().color).toBeDefined();
    expect(messages.adminPanelEmbed().title).toBeDefined();
    expect(messages.adminPanelEmbed().description).toBeDefined();
  });
  test("adminPanelLoadingEmbed", () => {
    expect(messages.adminPanelLoadingEmbed).toBeDefined();
    expect(messages.adminPanelLoadingEmbed.color).toBeDefined();
    expect(messages.adminPanelLoadingEmbed.title).toBeDefined();
    expect(messages.adminPanelLoadingEmbed.description).toBeDefined();
  });

  
  test("adminSendGetUserEmbed", () => {
    expect(messages.adminSendGetUserEmbed).toBeDefined();
    expect(messages.adminSendGetUserEmbed.color).toBeDefined();
    expect(messages.adminSendGetUserEmbed.title).toBeDefined();
    expect(messages.adminSendGetUserEmbed.description).toBeDefined();
  });
  test("adminGetUserCancelledEmbed", () => {
    expect(messages.adminGetUserCancelledEmbed).toBeDefined();
    expect(messages.adminGetUserCancelledEmbed.color).toBeDefined();
    expect(messages.adminGetUserCancelledEmbed.title).toBeDefined();
    expect(messages.adminGetUserCancelledEmbed.description).toBeDefined();
  });
  test("adminGetUserInvalidUserEmbed", () => {
    expect(messages.adminGetUserInvalidUserEmbed).toBeDefined();
    expect(messages.adminGetUserInvalidUserEmbed("").color).toBeDefined();
    expect(messages.adminGetUserInvalidUserEmbed("").title).toBeDefined();
    expect(messages.adminGetUserInvalidUserEmbed("").description).toBeDefined();
  });
  test("adminSendOverrideUserEmbed", () => {
    expect(messages.adminSendOverrideUserEmbed).toBeDefined();
    expect(messages.adminSendOverrideUserEmbed("").color).toBeDefined();
    expect(messages.adminSendOverrideUserEmbed("").title).toBeDefined();
    expect(messages.adminSendOverrideUserEmbed("").description).toBeDefined();
  });
  
  test("adminConfirmForceUploadEmbed", () => {
    expect(messages.adminConfirmForceUploadEmbed).toBeDefined();
    expect(messages.adminConfirmForceUploadEmbed.color).toBeDefined();
    expect(messages.adminConfirmForceUploadEmbed.title).toBeDefined();
    expect(messages.adminConfirmForceUploadEmbed.description).toBeDefined();
  });
  test("adminConfirmResetEmbed", () => {
    expect(messages.adminConfirmResetEmbed).toBeDefined();
    expect(messages.adminConfirmResetEmbed("").color).toBeDefined();
    expect(messages.adminConfirmResetEmbed("").title).toBeDefined();
    expect(messages.adminConfirmResetEmbed("").description).toBeDefined();
  });
  test("adminConfirmOverrideEmbed", () => {
    expect(messages.adminConfirmOverrideEmbed).toBeDefined();
    expect(messages.adminConfirmOverrideEmbed("", "").color).toBeDefined();
    expect(messages.adminConfirmOverrideEmbed("", "").title).toBeDefined();
    expect(messages.adminConfirmOverrideEmbed("", "").description).toBeDefined();
  });
  
  test("adminResetToPatronEmbed", () => {
    expect(messages.adminResetToPatronEmbed).toBeDefined();
    expect(messages.adminResetToPatronEmbed.color).toBeDefined();
    expect(messages.adminResetToPatronEmbed.title).toBeDefined();
    expect(messages.adminResetToPatronEmbed.description).toBeDefined();
  });
  test("adminOverrideToPatronEmbed", () => {
    expect(messages.adminOverrideToPatronEmbed).toBeDefined();
    expect(messages.adminOverrideToPatronEmbed("", "", "").color).toBeDefined();
    expect(messages.adminOverrideToPatronEmbed("", "", "").title).toBeDefined();
    expect(messages.adminOverrideToPatronEmbed("", "", "").description).toBeDefined();
  });

});

describe("regex", () => {
  
  test("User regex", () => {
    let user = regex.userRegex;
    expect(user.test("INVALID")).toBe(false);
    expect("https://vrchat.com/home/user/usr_135ec558-0b44-4c9d-85b3-4cdcfbc08123".match(user)[0]).toBe("usr_135ec558-0b44-4c9d-85b3-4cdcfbc08123");
  });

});