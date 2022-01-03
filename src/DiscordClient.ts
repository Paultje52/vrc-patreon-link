import { Client } from "discord.js";

export default class DiscordClient extends Client {

  constructor(token: string) {
    super({
      intents: [],
      userAgentSuffix: ["VRC-Patreon-Link"],

      presence: {
        status: "online",
        activities: [{
          name: "VRC Patreon Link",
          type: "PLAYING",
          url: "https://github.com/Paultje52/vrc-patreon-link"
        }]
      }

    });

    this.login(token);
  }

}