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
  });
  test("stillDmsClosedEmbed", () => {
    expect(messages.stillDmsClosedEmbed).toBeDefined();
  });
  
  test("welcomeMessageEmbed", () => {
    expect(messages.welcomeMessageEmbed).toBeDefined();
  });
  test("addVrChatLinkEmbed", () => {
    expect(messages.addVrChatLinkEmbed).toBeDefined();
  });
  test("removedLinkEmbed", () => {
    expect(messages.removedLinkEmbed).toBeDefined();
  });
  
  test("denyProfileTryAgainEmbed", () => {
    expect(messages.denyProfileTryAgainEmbed).toBeDefined();
  });
  test("acceptProfileEmbed", () => {
    expect(messages.acceptProfileEmbed).toBeDefined();
  });
  
  test("invalidLinkEmbed", () => {
    expect(messages.invalidLinkEmbed).toBeDefined();
  });
  test("invalidUseridEmbed", () => {
    expect(messages.invalidUseridEmbed).toBeDefined();
  });
  test("confirmUser", () => {
    expect(messages.confirmUser).toBeDefined();
  });
  
  test("adminPanelEmbed", () => {
    expect(messages.adminPanelEmbed).toBeDefined();
  });
  test("adminPanelLoadingEmbed", () => {
    expect(messages.adminPanelLoadingEmbed).toBeDefined();
  });

  
  test("adminSendGetUserEmbed", () => {
    expect(messages.adminSendGetUserEmbed).toBeDefined();
  });
  test("adminGetUserCancelledEmbed", () => {
    expect(messages.adminGetUserCancelledEmbed).toBeDefined();
  });
  test("adminGetUserInvalidUserEmbed", () => {
    expect(messages.adminGetUserInvalidUserEmbed).toBeDefined();
  });
  test("adminSendOverrideUserEmbed", () => {
    expect(messages.adminSendOverrideUserEmbed).toBeDefined();
  });
  
  test("adminConfirmForceUploadEmbed", () => {
    expect(messages.adminConfirmForceUploadEmbed).toBeDefined();
  });
  test("adminConfirmResetEmbed", () => {
    expect(messages.adminConfirmResetEmbed).toBeDefined();
  });
  test("adminConfirmOverrideEmbed", () => {
    expect(messages.adminConfirmOverrideEmbed).toBeDefined();
  });
  
  test("adminResetToPatronEmbed", () => {
    expect(messages.adminResetToPatronEmbed).toBeDefined();
  });
  test("adminOverrideToPatronEmbed", () => {
    expect(messages.adminOverrideToPatronEmbed).toBeDefined();
  });

});

describe("regex", () => {
  
  test("User regex", () => {
    let user = regex.userRegex;
    expect(user.test("INVALID")).toBe(false);
    expect("https://vrchat.com/home/user/usr_135ec558-0b44-4c9d-85b3-4cdcfbc08123".match(user)[0]).toBe("usr_135ec558-0b44-4c9d-85b3-4cdcfbc08123");
  });

});