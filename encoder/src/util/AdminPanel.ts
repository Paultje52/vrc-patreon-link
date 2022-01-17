import { ButtonInteraction, GuildMember, Interaction, Message, MessageActionRow, TextChannel, User } from "discord.js";
import DiscordClient from "../discord/DiscordClient";
import PatronInviter from "../patreon/PatronInviter";
import PatronUpdater from "../patreon/PatronUpdater";
import { adminPanelButtons, buttonIds } from "./buttons";
import Logger from "./Logger";
import { adminGetUserCancelledEmbed, adminGetUserInvalidUserEmbed, adminPanelEmbed, adminPanelLoadingEmbed, adminSendGetUserEmbed, adminSendOverrideUserEmbed, invalidLinkEmbed, invalidUseridEmbed } from "./messages";
import * as fs from "fs/promises";
import path = require("path");
import { oldUserRegex, userRegex } from "./regex";
import VrChat from "../vrchat/VrChat";
import Keyv = require("keyv");

export default class AdminPanel {

  private client: DiscordClient;
  private patronUploader: PatronUpdater;
  private patronInviter: PatronInviter;
  private vrChat: VrChat;
  private database: Keyv;

  private msg: Message;
  private channel: TextChannel;
  private logs: string[] = [];

  constructor(client: DiscordClient, patronUploader: PatronUpdater, patronInviter: PatronInviter, logger: Logger, vrChat: VrChat, database: Keyv) {
    this.client = client;
    this.patronUploader = patronUploader;
    this.patronInviter = patronInviter;
    this.vrChat = vrChat;
    this.database = database;

    let updateTimeout: NodeJS.Timeout;
    logger.onLog((log: string) => {
      if (log.includes("[DEBUG]")) return;

      this.logs.push(log
        .split(" [LOG]").join("")
        .split("'").join("")
        .split("\"").join("")
      );

      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        this.updateMessage();
      }, 500);
    });

    this.registerEvents();
  }
  
  public async start() {
    let guild = this.client.guilds.cache.get(process.env.GUILD_ID);
    let channel = await guild.channels.fetch(process.env.ADMIN_PANEL_CHANNEL);
    if (!(channel instanceof TextChannel)) throw new Error("ADMIN_PANEL_CHANNEL is not a text channel!");
    let msg = await channel.messages.fetch(process.env.ADMIN_PANEL_MESSAGE_ID).catch(() => null);

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

  private async updateMessage() {
    if (!this.msg) {
      console.warn("Admin panel message is not set yet!");
      return;
    }

    let parsedLogs = this.logs.join("");
    parsedLogs = parsedLogs.substring(parsedLogs.length-1750);

    return this.msg.edit({
      content: `\`\`\`toml\n${parsedLogs}\`\`\``,
      embeds: [adminPanelEmbed()],
      components: [new MessageActionRow().addComponents(
        adminPanelButtons.restart,
        adminPanelButtons.forceUpload,
        adminPanelButtons.exportList
      ), new MessageActionRow().addComponents(
        adminPanelButtons.resetSpecifiedUser,
        adminPanelButtons.overrideSpecifiedUser
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
    });
  }

  private async forceUploadButtonClick(user: User) {
    console.log(`[Button action by ${user.username}] Force uploading...`);
    await this.patronUploader.syncWithVrChat(true);
    console.log(`[Button action by ${user.username}] Force upload done!`);

    // this.updateMessage();
  }

  private async exportListButtonClick(user: User) {
    console.log(`[Button action by ${user.username}] Exporting patron list...`);

    let list = await this.patronUploader.getPatronList();

    let fullPath = path.join(__dirname, "patrons.txt");
    await fs.writeFile(fullPath, list);
    await this.channel.send({
      files: [
        fullPath
      ]
    });
    await fs.rm(fullPath);
    
    console.log(`[Button action by ${user.username}] Exported patron list in channel!`);
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

      console.log(`[Button action by ${user.username}] Resetting ${targetUser.user.username}...`);
  
      let patron = this.client.getPatron(targetUser);
      await this.patronInviter.removePatron(patron);
      this.client.emit("guildMemberUpdate", targetUser, targetUser);
  
      console.log(`[Button action by ${user.username}] ${targetUser.user.username} resetted!`);
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

        console.log(`[Button action by ${user.username}] Overriding ${targetUser.user.username}...`);
  
        let patron = this.client.getPatron(targetUser);
        await patron.setUserid(userId, this.database);
    
        console.log(`[Button action by ${user.username}] ${targetUser.user.username} set to ${await this.vrChat.getUsernameFromId(userId)}!`);

      });
      // Remove message on end
      messageCollector.on("end", () => {
        msg.delete();
      });

    });
  }

}