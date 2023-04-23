import { ButtonInteraction, GuildMember, Message, MessageCreateOptions } from "discord.js";
import { LINK_STATE } from "@prisma/client";
import { welcomeMessage, buttonIds, sendNameOrIdMessage, invalidIdMessage, confirmProfileMessage, noUsernameResultsMessage, selectUsersSearchResult, canceledLinkMessage, linkSuccessMessage, unlinkSuccessMessage, dmClosedMessage } from "./config/messagePayloads";
import { oldUserRegex, userRegex } from "./util/regex";
import DiscordClient from "./client/DiscordClient";

export default class User {
  private guildMember: GuildMember;
  private discordClient: DiscordClient;
  private linkState: LINK_STATE = LINK_STATE.NOT_INVITED;
  private vrChatId: string | null = null;

  constructor(guildMember: GuildMember, discordClient: DiscordClient) {
    this.guildMember = guildMember;
    this.discordClient = discordClient;
  }

  /**
   * Fetches the current user state and saves it in the cache
   */
  public async fetchState(): Promise<void> {
    const user = await this.discordClient.getPrismaClient().user.findUnique({
      where: {
        id: this.guildMember.id
      }
    });

    if (user) {
      this.linkState = user.linkState;
      this.vrChatId = user.vrChatId || null;
    }
  }

  /**
   * Get the link state of the user (from the cache)
   * @returns {LINK_STATE} The link state of the user
   */
  public getLinkState(): LINK_STATE {
    return this.linkState;
  }

  /**
   * Get the VRChat ID of the user
   * @returns {string | null} The VRChat ID of the user
   */
  public getVRChatId(): string | null {
    return this.vrChatId;
  }

  /**
   * Get the guild member object of the user
   * @returns {GuildMember} The guild member
   */
  public getDiscordMember(): GuildMember {
    return this.guildMember;
  }

  /**
   * Send a welcome message to the user
   */
  public async invite(): Promise<void> {
    const res = await this.sendMessage(welcomeMessage)
      .catch(() => {
        // The user doesn't have DMs enabled
        const channel = this.guildMember.guild.channels.cache.get(process.env.DM_CLOSED_CHANNEL!);
        if (channel?.isTextBased()) channel.send(dmClosedMessage(this.guildMember.id));
        console.log("  DMs are closed - sent a message in the server instead");

        return false;
      });

    if (res !== false) {
      console.log("  Invite successful!");
    }

    await this.setLinkState(LINK_STATE.INVITED);
  }

  /**
   * When a user clicks on a button in a DM
   * @param {ButtonInteraction} interaction The interaction object
   */
  public async buttonInteraction(interaction: ButtonInteraction): Promise<void> {
    if (interaction.customId === buttonIds.addLinkId && this.linkState === LINK_STATE.INVITED) {
      await interaction.deferUpdate();
      await this.sendMessage(sendNameOrIdMessage);
      await this.setLinkState(LINK_STATE.PROVIDE_NAME_OR_ID);

      return;
    }

    if (this.linkState === LINK_STATE.CONFIRM_SELECT) {
      if (interaction.customId === buttonIds.cancelConfirm) {
        // Cancel the link
        await interaction.deferUpdate();
        await this.sendMessage(canceledLinkMessage);
        await this.setLinkState(LINK_STATE.PROVIDE_NAME_OR_ID);

      } else {
        // Confirm the link (The user is done)
        await interaction.deferUpdate();

        const user = await this.discordClient.getVRChatClient().fetchUser(interaction.customId.split("USER_confirm_")[1]);
        if (!user) return;

        await this.setVRChatId(interaction.customId.split("USER_confirm_")[1]);
        await this.setLinkState(LINK_STATE.LINKED);

        this.sendMessage(linkSuccessMessage(user));
        console.log(`${this.guildMember.user.tag} (${this.guildMember.id}) linked their account successfully to ${user.name} (${user.id})`);
      }

      return;
    }

    if (this.linkState === LINK_STATE.LINKED && interaction.customId === buttonIds.unlink) {
      await interaction.deferUpdate();
      await this.setVRChatId(null);
      await this.setLinkState(LINK_STATE.INVITED);
      await this.sendMessage(unlinkSuccessMessage);

      return;
    }

    // Maybe something went wrong with the cache
    // Let's fetch the state just to be sure
    await this.fetchState();
  }

  /**
   * When a user sends a message in a DM
   * @param {Message} message The message object
   */
  public async messageInteraction(message: Message): Promise<void> {
    if (this.linkState === LINK_STATE.PROVIDE_NAME_OR_ID) {
      let vrChatId = message.content.match(userRegex) || message.content.match(oldUserRegex);
      if (vrChatId && vrChatId.includes("vrchat.com/home/user/")) vrChatId[0] = vrChatId[0].replace("vrchat.com/home/user/", "").split("/").join("");

      // If the user provided an ID (that's easy)
      if (vrChatId) {
        const user = await this.discordClient.getVRChatClient().fetchUser(vrChatId[0]);
        if (!user) {
          this.sendMessage(invalidIdMessage);
          return;
        }

        await this.setLinkState(LINK_STATE.CONFIRM_SELECT);
        this.sendMessage(confirmProfileMessage(user));
        return;
      }

      // If the user provided a name (provide a list of options)
      const users = await this.discordClient.getVRChatClient().searchUser(message.content);
      if (!users || users.length === 0) {
        this.sendMessage(noUsernameResultsMessage);
        return;
      }

      if (users.length === 1) await this.sendMessage(confirmProfileMessage(users[0]));
      else await this.sendMessage(selectUsersSearchResult(users));

      await this.setLinkState(LINK_STATE.CONFIRM_SELECT);
    }
  }

  private async setLinkState(value: LINK_STATE) {
    this.linkState = value;

    await this.discordClient.getPrismaClient().user.upsert({
      where: {
        id: this.guildMember.id
      },
      update: {
        linkState: value
      },
      create: {
        id: this.guildMember.id,
        linkState: value
      }
    });
  }

  private async setVRChatId(value: string | null) {
    this.vrChatId = value;

    await this.discordClient.getPrismaClient().user.update({
      where: {
        id: this.guildMember.id
      },
      data: {
        vrChatId: value
      }
    });
  }

  private sendMessage(payload: MessageCreateOptions): Promise<Message> {
    return this.guildMember.user.send(payload);
  }
}
