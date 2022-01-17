export default function checkEnvironmentVariables() {
  require("dotenv").config();
  // Discord stuff
  if (!process.env.DISCORD_TOKEN) throw new Error("DISCORD_TOKEN in .env file is not set!");
  if (!process.env.GUILD_ID) throw new Error("GUILD_ID in .env file is not set!");
  if (!process.env.ROLE_ID) throw new Error("ROLE_ID in .env file is not set!");
  if (!process.env.PATREON_CHANNEL) throw new Error("PATREON_CHANNEL in .env file is not set!");

  // Staff panel
  if (!process.env.ADMIN_PANEL_CHANNEL) throw new Error("ADMIN_PANEL_CHANNEL in .env file is not set!");

  // VRChat stuff
  if (!process.env.VR_CHAT_USERNAME) throw new Error("VR_CHAT_USERNAME in .env file is not set!");
  if (!process.env.VR_CHAT_PASSWORD) throw new Error("VR_CHAT_PASSWORD in .env file is not set!");
  if (!process.env.VR_CHAT_AVATARID) throw new Error("VR_CHAT_AVATARID in .env file is not set!");

  // Logger stuff
  if (!process.env.LOGGER_ENABLED) throw new Error("LOGGER_ENABLED in .env file is not set!");
  if (!process.env.LOGGER_TIMEZONE) throw new Error("LOGGER_TIMEZONE in .env file is not set!");
}