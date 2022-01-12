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
      PATREON_CHANNEL: "channel"
    };
    expect(checkEnvironmentVariables).toThrow();
  });

  test("Discord and vrchat args", () => {
    process.env = {
      DISCORD_TOKEN: "token",
      GUILD_ID: "guild",
      ROLE_ID: "role",
      PATREON_CHANNEL: "channel",

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

});

describe("regex", () => {
  
  test("User regex", () => {
    let user = regex.userRegex;
    expect(user.test("INVALID")).toBe(false);
    expect("https://vrchat.com/home/user/usr_135ec558-0b44-4c9d-85b3-4cdcfbc08123".match(user)[0]).toBe("usr_135ec558-0b44-4c9d-85b3-4cdcfbc08123");
  });

});