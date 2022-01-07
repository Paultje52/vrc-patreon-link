import { Client, Guild, GuildMember, Role, TextChannel, User } from "discord.js";
import Patron from "../patreon/Patron";
import type { ClientOptions } from "../VrcPatreonLinkTypes";

export default class DiscordClient extends Client {

  private guildId: string;
  private roleIds: string[];
  private mainChannelId: string;

  private patrons: Map<string, Patron> = new Map<string, Patron>();

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
    this.roleIds = options.roles.split(" ");
    this.mainChannelId = options.channel;

    console.log(`Loaded ${this.roleIds.length} role ids!`);
    this.login(options.token);
  }

  public getMainGuild(): Guild {
    let guild = this.guilds.cache.get(this.guildId);
    if (!guild) throw new Error(`Guild ${this.guildId} not found!`);

    return guild;
  }

  public async getMainGuildChannel(): Promise<TextChannel> {
    let guild = this.getMainGuild();
    let channel = await guild.channels.fetch(this.mainChannelId);
    if (!channel || !channel.isText()) throw new Error(`Channel ${this.mainChannelId} not found! Are you sure it's a TextChannel?`);

    // @ts-ignore - Typescript is stupid some times. We checked if it's a TextChannel above. When it isn't, the code throws an error instead of returning an invalid channel.
    return channel;
  }

  public getMainGuildMember(user: User): Promise<GuildMember> {
    let guild = this.getMainGuild();
    return guild.members.fetch(user.id);
  }

  public async getMainGuildPatronRoles(): Promise<Map<string, Role>> {
    let roles = new Map<string, Role>();
    let guild = this.getMainGuild();

    for (let roleId of this.roleIds) {
      let role = await guild.roles.fetch(roleId);
      if (!role) {
        console.warn(`Couldn't fetch role ${roleId}!`);
        continue;
      }

      roles.set(role.id, role);
    }

    return roles;
  }

  public async fetchPatrons(): Promise<Patron[]> {

    let guild = this.getMainGuild();

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
      .map((member) => this.getPatron(member));
  }

  public getPatron(member: GuildMember) {
    let patron = this.patrons.get(member.id);
    if (!patron) {
      patron = new Patron(member);
      this.patrons.set(member.id, patron);
    }
    return patron;
  }

}