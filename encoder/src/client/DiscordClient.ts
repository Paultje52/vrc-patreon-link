import { LINK_STATE, PrismaClient } from "@prisma/client";
import { ActivityType, Client, GatewayIntentBits, Partials } from "discord.js";
import Queue from "../util/Queue";
import User from "../User";
import VRChatClient from "./VRChatClient";
import GithubClient from "./GithubClient";

export default class DiscordClient extends Client {
  private prismaClient = new PrismaClient();
  private vrChatClient?: VRChatClient;
  private githubClient?: GithubClient;

  private allUsers = new Map<string, User>();
  private queue = new Queue();
  private patreonUploadString = "";
  private lastSync = 0;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds, // This is required for the fetchUsers() method - But this isn't a bug according to this issue: https://github.com/discordjs/discord.js/issues/8552
        GatewayIntentBits.DirectMessages
      ],
      partials: [
        Partials.Channel
      ],
      rest: {
        userAgentAppendix: "VRC-Patreon-Link"
      },
      presence: {
        status: "dnd",
        afk: true
      }
    });
  }

  /**
   * Set VR Chat client (Only use while initializing the discord client)
   * @param {VRChatClient} vrchatClient The VR Chat client
   */
  public setVRChatClient(vrchatClient: VRChatClient): void {
    this.vrChatClient = vrchatClient;
  }
  /**
   * Get the VR Chat client
   * @returns {VRChatClient} The VR Chat client
   */
  public getVRChatClient(): VRChatClient {
    return this.vrChatClient!;
  }

  /**
   * Set Github Client (Only use while initializing the discord client)
   * @param {GithubClient} githubClient The Github client
   */
  public setGithubClient(githubClient: GithubClient): void {
    this.githubClient = githubClient;
  }
  /**
   * Get the Github client
   * @returns {GithubClient} The Github client
   */
  public getGithubClient(): GithubClient {
    return this.githubClient!;
  }

  /**
   * Get a queue to add tasks, for example sending new DMs to users
   * @returns {Queue} The queue
   */
  public getQueue(): Queue {
    return this.queue;
  }

  /**
   * Get the Prisma client (for database access)
   * @returns {PrismaClient} The Prisma client
   */
  public getPrismaClient(): PrismaClient {
    return this.prismaClient;
  }

  /**
   * Update the presence of the bot
   */
  public updatePresence(): void {
    const users = this.getAllUsers()?.size || 0;

    this.user?.setPresence({
      status: "online",
      afk: false,
      activities: [
        {
          name: `${users} ${users === 1 ? "user" : "users"}`,
          type: ActivityType.Watching
        }
      ]
    });
  }

  /**
   * Fetch users in the guild with the roles
   * @returns {Promise<Map<string, User>>} A map of all users with the given role IDs
   */
  public async fetchUsers(): Promise<Map<string, User>> {
    const guildId = process.env.GUILD_ID!;
    const roleIds = Object.keys(process.env)
      .filter((key) => key.startsWith("ROLE_IDS_"))
      .map((key) => process.env[key]!.split(" - "))
      .reduce((a, b) => a.concat(b));

    const guild = await this.guilds.fetch(guildId);
    const members = await guild.members.fetch();

    const users = new Map<string, User>();

    members
      .filter((member) =>
        member.roles.cache.some((role) => roleIds.includes(role.id))
      )
      .forEach((member) => {
        const user = new User(member, this);
        users.set(member.id, user);
      });

    await Promise.all(
      Array.from(users.values()).map((user) =>
        user.fetchState()
      )
    );

    return users;
  }

  /**
   * Get all users (from the cache)
   * @returns {Map<string, User>} A map of all users
   */
  public getAllUsers(): Map<string, User> {
    return this.allUsers;
  }
  /**
   * Update the allUsers cache
   * @param {Map<string, User>} value The new value
   */
  public setAllUsers(value: Map<string, User>): void {
    this.allUsers = value;
  }

  /**
   * Get the patreon upload string
   * @returns {Promise<string>} The patreon upload string
   */
  public async getPatreonUploadString(): Promise<string> {
    const patreons = new Map<string, string[]>();
    const roles = Object.keys(process.env)
      .filter((key) => key.startsWith("ROLE_IDS_"))
      .map((key) => {
        return {
          name: key.replace("ROLE_IDS_", ""),
          roles: process.env[key]!.split(" - ")
        }
      });

    for (const user of this.getAllUsers().values()) {
      if (user.getLinkState() !== LINK_STATE.LINKED) continue;

      const vrChatId = user.getVRChatId();
      if (!vrChatId) continue;

      const vrChatUser = await this.getVRChatClient().fetchUser(vrChatId);
      if (!vrChatUser) continue;

      for (const role of roles) {
        if (user.getDiscordMember().roles.cache.some((r) => role.roles.includes(r.id))) {
          const patreon = patreons.get(role.name) || [];
          patreon.push(vrChatUser.name);
          patreons.set(role.name, patreon);
        }
      }
    }

    return Array.from(patreons.entries())
      .map(([name, users]) => `${name}.${users.join(".")}`)
      .join("\n");
  }

  /**
   * Update the patreon upload string in Github (if the string has changed)
   */
  public async updatePatreons() {
    const start = Date.now();
    console.log("Updating patreons...");

    const newUploadString = await this.getPatreonUploadString();
    if (newUploadString === this.patreonUploadString) {
      console.log("  No changes, skipping upload");
      return;
    }

    await this.getGithubClient().updateFile(newUploadString);
    this.patreonUploadString = newUploadString;
    this.lastSync = Date.now();
    console.log(`  Updated patreons - Took ${Date.now() - start}ms`);
  }
}
