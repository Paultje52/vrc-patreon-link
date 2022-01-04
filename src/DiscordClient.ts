import { Client, User } from "discord.js";
import type { ClientOptions } from "./VrcPatreonLinkTypes";

export default class DiscordClient extends Client {

  private guildId: string;
  private roleIds: string[];

  constructor(options: ClientOptions) {
    super({
      intents: [
        "GUILD_MEMBERS",
        "DIRECT_MESSAGES"
      ],
      partials: [
        "CHANNEL"
      ],
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
    
    this.guildId = options.guild;
    this.roleIds = options.role.split(" ");

    this.login(options.token);
  }

  public async fetchPatrons(): Promise<Array<User>> {

    let guild = this.guilds.cache.get(this.guildId);
    if (!guild) throw new Error(`Guild ${this.guildId} not found!`);

    let members = await guild.members.fetch()
      .catch(console.error);

    if (!members) {
      console.warn("Couldn't fetch members!");
      return [];
    }

    let roles: String[] = [];
    for (let roleId of this.roleIds) {
      let role = await guild.roles.fetch(roleId);

      if (!role) console.warn(`Role ${roleId} not found!`);
      else roles.push(role.id);
    }

    return members
      .filter((member) => member.roles.cache.some(role => roles.includes(role.id)))
      .map((member) => member.user);
  }

}