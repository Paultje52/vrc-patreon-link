import { ButtonInteraction, GuildMember, Interaction, Message, MessageActionRow, TextChannel, User } from "discord.js";
import DiscordClient from "../discord/DiscordClient";
import PatronInviter from "../patreon/PatronInviter";
import PatronUpdater from "../patreon/PatronUpdater";
import { adminPanelButtons, buttonIds, removeLink } from "./buttons";
import Logger from "./Logger";
import { adminConfirmForceUploadEmbed, adminConfirmOverrideEmbed, adminConfirmResetEmbed, adminGetUserCancelledEmbed, adminGetUserInvalidUserEmbed, adminOverrideToPatronEmbed, adminPanelEmbed, adminPanelLoadingEmbed, adminResetToPatronEmbed, adminSendGetUserEmbed, adminSendOverrideUserEmbed, invalidLinkEmbed, invalidUseridEmbed } from "./messages";
import * as fs from "fs/promises";
import path = require("path");
import { oldUserRegex, userRegex } from "./regex";
import VrChat from "../vrchat/VrChat";
import Keyv = require("keyv");
import { linkStatuses } from "../patreon/Patron";
import { LinkStatusses } from "../VrcPatreonLinkTypes";

export default class AdminPanel {

  private client: DiscordClient;
  private patronUploader: PatronUpdater;
  private patronInviter: PatronInviter;
  private vrChat: VrChat;
  private database: Keyv;

  private msg: Message;
  private channel: TextChannel;
  private logs: {time: number, log: string}[] = [];
  private updateTimeout: NodeJS.Timeout;
  private linkStatusCache: LinkStatusses;

  constructor(client: DiscordClient, patronUploader: PatronUpdater, patronInviter: PatronInviter, logger: Logger, vrChat: VrChat, database: Keyv) {
    this.client = client;
    this.patronUploader = patronUploader;
    this.patronInviter = patronInviter;
    this.vrChat = vrChat;
    this.database = database;

    logger.onLog(this.onLog.bind(this));
    this.registerEvents();
  }

  private async getLinkStatus(): Promise<LinkStatusses> {

    if (this.linkStatusCache && this.linkStatusCache.date > Date.now() - 1000 * 60 * 60) return this.linkStatusCache;

    let patrons = await this.client.fetchPatrons();
    let notLinkedYet = [];

    for (let patron of patrons) {
      let link = await patron.getLinkStatus(this.database);
      if (link !== linkStatuses.linked) notLinkedYet.push(patron);
    }

    this.linkStatusCache = {
      date: Date.now(),
      total: patrons.length,
      notLinkedYet
    }
    return this.linkStatusCache;

  }

  private onLog(log: string): void {
    if (log.includes("[DEBUG]")) return;

    this.logs.push({
      time: Date.now(),
      log: log
        .split(" [LOG]").join("")
        .split("'").join("")
        .split("\"").join("")
        .split("\n").join("")
    });

    if (this.updateTimeout) clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => {
      this.updateMessage();
    }, 500);
  }
  
  public async start() {
    let guild = this.client.guilds.cache.get(process.env.GUILD_ID);
    let channel = await guild.channels.fetch(process.env.ADMIN_PANEL_CHANNEL);
    if (!(channel instanceof TextChannel)) throw new Error("ADMIN_PANEL_CHANNEL is not a text channel!");
    let msg = await channel.messages.fetch(process.env.ADMIN_PANEL_MESSAGE_ID || "123").catch(() => null);

    if (!msg) {
      msg = await channel.send({
        embeds: [adminPanelLoadingEmbed]
      });
      process.env.ADMIN_PANEL_MESSAGE_ID = msg.id;
      console.log(`Admin panel message ID set to ${msg.id} - Please save this in the environment variables as ADMIN_PANEL_MESSAGE_ID`);
    }

    this.msg = msg;
    this.channel = channel;
    this.updateMessage();
  }

  private parseLogs(): string {
    let formatedLogs = [...this.logs].map(({time, log}) => `<t:${Math.round(time/1000)}:R> \`\`${log}\`\``).reverse();
    let parsed = [];
    let parsedLength = 0;

    for (let log of formatedLogs) {
      if (parsedLength + log.length > 1750) break;
      parsed.push(log);
      parsedLength += log.length;
    }

    return parsed.reverse().join("\n");
  }

  private async updateMessage() {
    if (!this.msg) {
      console.warn("Admin panel message is not set yet!");
      return;
    }

    let embedMsg = "";
    // Last sync
    let lastSync = this.patronUploader.getLastSync();
    if (lastSync) embedMsg += `**Last sync:** <t:${Math.floor(lastSync/1000)}:R>\n`;
    else embedMsg += `**Last sync:** _Not yet_\n`;

    // Link status
    let linkStatus = await this.getLinkStatus();
    let amountAlreadyLinked = linkStatus.total-linkStatus.notLinkedYet.length;
    embedMsg += `**Link status:** ${amountAlreadyLinked}/${linkStatus.total}`;
    if (linkStatus.notLinkedYet.length <= 5 && linkStatus.notLinkedYet.length > 0) embedMsg += `\n> Not linked: ${linkStatus.notLinkedYet.map(p => `_<@${p.getMember().id}>_`).join(" - ")}\n`;

    // Update msg
    return this.msg.edit({
      content: this.parseLogs(),
      embeds: [adminPanelEmbed(embedMsg)],
      components: [new MessageActionRow().addComponents(
        adminPanelButtons.restart,
        adminPanelButtons.forceUpload,
        adminPanelButtons.exportList
      ), new MessageActionRow().addComponents(
        adminPanelButtons.resetSpecifiedUser,
        adminPanelButtons.overrideSpecifiedUser
      ), new MessageActionRow().addComponents(
        adminPanelButtons.resetSyncState
      )]
    }).catch(() => null);
  }

  private registerEvents() {
    this.onButtonClick = this.onButtonClick.bind(this);
    this.client.on("interactionCreate", this.onButtonClick);
  }

  private onButtonClick(interaction: Interaction) {
    if (!interaction.isButton()) return;
  
    let buttonInteraction = <ButtonInteraction> interaction;

    switch (buttonInteraction.customId) {
      case buttonIds.adminPanelIds.restartId:
        interaction.deferUpdate();
        this.restartButtonClick(buttonInteraction.user);
        break;

      case buttonIds.adminPanelIds.forceUploadId:
        interaction.deferUpdate();
        this.forceUploadButtonClick(buttonInteraction.user);
        break;
      case buttonIds.adminPanelIds.exportListId:
        interaction.deferUpdate();
        this.exportListButtonClick(buttonInteraction.user);
        break;

      case buttonIds.adminPanelIds.resetSpecifiedUserId:
        interaction.deferUpdate();
        this.resetSpecifiedUserButtonClick(buttonInteraction.user);
        break;

      case buttonIds.adminPanelIds.overrideSpecifiedUserId:
        interaction.deferUpdate();
        this.overrideSpecifiedUserButtonClick(buttonInteraction.user);
        break;
    }
  }

  private async restartButtonClick(user: User) {
    console.log(`[Button action by ${user.username}] Restarting...`);
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }

  private async forceUploadButtonClick(user: User) {
    await this.patronUploader.syncWithVrChat(true);
    console.log(`[Button action by ${user.username}] Force uploaded!`);

    this.channel.send({
      embeds: [adminConfirmForceUploadEmbed]
    }).then((msg: Message) => {
      setTimeout(() => {
        msg.delete();
      }, 5000);
    });
  }

  private async exportListButtonClick(user: User) {
    let list = await this.patronUploader.getPatronList();

    let fullPath = path.join(__dirname, "patrons.txt");
    await fs.writeFile(fullPath, list);
    await this.channel.send({
      files: [
        fullPath
      ]
    });
    await fs.rm(fullPath);
    
    console.log(`[Button action by ${user.username}] Exported patron list in admin channel!`);
  }

  private async getSpecifiedUser(user: User, callback: (specifiedUser: GuildMember) => void) {
    let cancelButton = adminPanelButtons.cancel(user.id);

    let msg = await this.channel.send({
      content: `<@${user.id}>`,
      embeds: [adminSendGetUserEmbed],
      components: [new MessageActionRow().addComponents(
        cancelButton
      )]
    });

    // Collectors
    let buttonCollector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === user.id,
      time: 1000*30
    });
    let messageCollector = this.channel.createMessageCollector({
      filter: (m) => m.author.id === user.id,
      time: 1000*30
    });

    // Cancel button
    buttonCollector.on("collect", (i) => {
      let buttonInteraction = <ButtonInteraction> i;

      if (buttonInteraction.customId !== cancelButton.customId) return;

      buttonInteraction.deferUpdate();
      messageCollector.stop();

      this.channel.send({
        embeds: [adminGetUserCancelledEmbed]
      }).then(msg => {
        setTimeout(() => {
          msg.delete();
        }, 5000);
      });

      return;
    });

    // UserID collector
    messageCollector.on("collect", async (m) => {
      m.delete();
      messageCollector.stop();

      let targetUser = await msg.guild.members.fetch(m.content)
        .catch(() => undefined);
      if (!targetUser) {
        this.channel.send({
          embeds: [adminGetUserInvalidUserEmbed(m.content)]
        }).then(msg => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });

        return;
      }
      
      callback(targetUser);
    });
    // Remove message on end
    messageCollector.on("end", () => {
      msg.delete();
    });

  }

  private resetSpecifiedUserButtonClick(user: User) {
    this.getSpecifiedUser(user, async (targetUser: GuildMember) => {
      if (!targetUser) return;
  
      let patron = this.client.getPatron(targetUser);
      await this.patronInviter.removePatron(patron);
      this.client.emit("guildMemberUpdate", targetUser, targetUser);
  
      console.log(`[Button action by ${user.username}] User ${targetUser.user.username} resetted!`);
      this.channel.send({
        embeds: [adminConfirmResetEmbed(targetUser.user.username)]
      }).then((msg: Message) => {
        setTimeout(() => {
          msg.delete();
        }, 10000);
      });

      patron.sendMessage({
        embeds: [adminResetToPatronEmbed]
      }).catch(() => null);
    });
  }

  private async overrideSpecifiedUserButtonClick(user: User) {
    this.getSpecifiedUser(user, async (targetUser: GuildMember) => {
      if (!targetUser) return;

      let cancelButton = adminPanelButtons.cancel(user.id);

      let msg = await this.channel.send({
        embeds: [adminSendOverrideUserEmbed(targetUser.user.username)],
        components: [new MessageActionRow().addComponents(
          cancelButton
        )]
      });

      // Collectors
      let buttonCollector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === user.id,
        time: 1000*30
      });
      let messageCollector = this.channel.createMessageCollector({
        filter: (m) => m.author.id === user.id,
        time: 1000*30
      });

      // Cancel button
      buttonCollector.on("collect", (i) => {
        let buttonInteraction = <ButtonInteraction> i;

        if (buttonInteraction.customId !== cancelButton.customId) return;

        buttonInteraction.deferUpdate();
        messageCollector.stop();

        this.channel.send({
          embeds: [adminGetUserCancelledEmbed]
        }).then(msg => {
          setTimeout(() => {
            msg.delete();
          }, 5000);
        });

        return;
      });

      // UserID collector
      messageCollector.on("collect", async (m) => {
        m.delete();
        messageCollector.stop();

        let matches = m.content.match(userRegex);
        if (!matches) {
          // Check for old userIds, because VRChat cannot make it easy for one *** time...
          matches = m.content.match(oldUserRegex);
    
          if (!matches) {
            this.channel.send({
              embeds: [ invalidLinkEmbed(m.content) ]
            }).then((m) => {
              setTimeout(() => {
                m.delete();
              }, 5000);
            });
            return;
          }
    
          matches[0] = matches[0].replace("vrchat.com/home/user/", "")
            .split("/").join(""); // Replace multiple
        }
    
        let userId = matches[0];
        let exists = await this.vrChat.userExists(userId);
        
        if (!exists) {
          this.channel.send({
            embeds: [ invalidUseridEmbed(userId) ]
          }).then((m) => {
            setTimeout(() => {
              m.delete();
            }, 5000);
          });
          return;
        }
  
        let patron = this.client.getPatron(targetUser);
        await patron.setUserid(userId, this.database);
        let username = await this.vrChat.getUsernameFromId(userId);

        console.log(`[Button action by ${user.username}] Overrided ${targetUser.user.username} to ${username}!`);
        this.channel.send({
          embeds: [adminConfirmOverrideEmbed(targetUser.user.username, username)]
        }).then((msg: Message) => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
        
        patron.sendMessage({
          embeds: [adminOverrideToPatronEmbed(username, await this.vrChat.getAvatarFromId(userId), userId)],
          components: [new MessageActionRow().addComponents(
            removeLink
          )]
        }).catch(() => null);

      });
      // Remove message on end
      messageCollector.on("end", () => {
        msg.delete();
      });

    });
  }

}