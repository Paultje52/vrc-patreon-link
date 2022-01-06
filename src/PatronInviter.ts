import { acceptProfileEmbed, addVrChatLinkEmbed, confirmUser, denyProfileTryAgainEmbed, dmsClosedEmbed, invalidLinkEmbed, invalidUseridEmbed, removedLinkEmbed, stillDmsClosedEmbed, welcomeMessageEmbed } from "./util/messages";
import { addLink, addLinkServer, addProfileNo, addProfileYes, buttonIds, removeLink } from "./util/buttons";
import { ButtonInteraction, Interaction, Message, MessageActionRow } from "discord.js";
import Patron, { linkStatuses } from "./Patron";
import DiscordClient from "./DiscordClient";
import { userRegex } from "./util/regex";
import VrChat from "./VrChat";
import * as Keyv from "keyv";
import Queue from "./util/Queue";

export default class PatronInviter {

  private client: DiscordClient;
  private database: Keyv;
  private vrChat: VrChat;
  private queue: Queue = new Queue(15000);

  constructor(client: DiscordClient, database: Keyv, vrChat: VrChat) {
    this.client = client;
    this.database = database;
    this.vrChat = vrChat;

    this.registerEvents();
  }

  public inviteNewPatrons(patrons: Patron[]) {
    for (let patron of patrons) {
      this.inviteNewPatron(patron);
    }
  }

  public async inviteNewPatron(patron: Patron) {

    // Get patron status
    let status = await patron.getLinkStatus(this.database);
    if (status !== linkStatuses.notInvited) return;

    patron.setLinkStatus(linkStatuses.invited, this.database);

    this.queue.add(() => {
      
      // Send a message to the new user!
      patron.sendMessage({
        embeds: [ welcomeMessageEmbed ],
        components: [
          new MessageActionRow().addComponents(addLink)
        ]
      }).then(() => {
        // Successfully sent message, set link status to invited
        console.log(`Sent welcome message to new patron: ${patron.getMember().displayName} (${patron.getMember().id})`);

      }).catch(async () => {
        // We cannot send the user a DM, because they have DMs disabled.
        // Let's send a message in the server mentioning them instead.
        console.log(`Couldn't invite ${patron.getMember().displayName} (${patron.getMember().id}) - Send a message in the server instead.`);
        let channel = await this.client.getMainGuildChannel();
        let msg = await channel.send({
          embeds: [dmsClosedEmbed],
          content: `<@${patron.getMember().id}>`,
          components: [new MessageActionRow().addComponents(
            addLinkServer
          )]
        });

        this.database.set("server-message."+msg.id, patron.getMember().id);
      });

    });
    

  }

  private registerEvents() {
    this.userButtonPressEvent = this.userButtonPressEvent.bind(this);
    this.messageCreateEvent = this.messageCreateEvent.bind(this);

    this.client.on("interactionCreate", this.userButtonPressEvent);
    this.client.on("messageCreate", this.messageCreateEvent);
  }
  
  // interactionCreate event
  private async userButtonPressEvent(interaction: Interaction) {
    if (!interaction.isButton()) return;
  
    let buttonInteraction = <ButtonInteraction> interaction;
    interaction.deferUpdate();

    let member = await this.client.getMainGuildMember(interaction.user);
    let patron = this.client.getPatron(member);

    switch (buttonInteraction.customId) {
      case buttonIds.addLinkId:
        this.addLinkButtonClick(patron);
        break;
      case buttonIds.addLinkSetverId:
        this.addLinkServerButtonClick(patron, buttonInteraction.message);
        break;

      case buttonIds.addProfileYesId:
        this.confirmProfileButtonClick(patron);
        break;
      case buttonIds.addProfileNoId:
        this.denyProfileButtonClick(patron);
        break;

      case buttonIds.removeLinkId:
        this.removeLinkButtonClick(patron);
        break;
    }
  }

  private async addLinkServerButtonClick(patron: Patron, msg: any) {
    let targetUserId = await this.database.get("server-message."+msg.id);
    if (patron.getMember().id !== targetUserId) return;

    if (await patron.getLinkStatus(this.database) !== linkStatuses.invited) return;

    patron.sendMessage({
      embeds: [addVrChatLinkEmbed]
    }).then(() => {
      // DMs are now open!
      patron.setLinkStatus(linkStatuses.waitingForLink, this.database);

    }).catch(async () => {
      // We still cannot send a DM message to the user!
      let channel = await this.client.getMainGuildChannel();
      channel.send({
        content: `<@${patron.getMember().id}>`,
        embeds: [stillDmsClosedEmbed]
      })
    })
  }
  
  private async addLinkButtonClick(patron: Patron) {
    if (await patron.getLinkStatus(this.database) !== linkStatuses.invited) return;

    patron.setLinkStatus(linkStatuses.waitingForLink, this.database);
    patron.sendMessage({
      embeds: [addVrChatLinkEmbed]
    });
  }

  private async confirmProfileButtonClick(patron: Patron) {
    if (await patron.getLinkStatus(this.database) !== linkStatuses.waitingOnConfirmation) return;

    let userId = await patron.getConfirmationProfileId(this.database);
    let username = await this.vrChat.getUsernameFromId(userId);

    patron.setUserid(userId, this.database);
    patron.sendMessage({
      embeds: [acceptProfileEmbed(username)],
      components: [new MessageActionRow().addComponents(
        removeLink
      )]
    });

    patron.removeConfirmationProfileId(this.database);
    console.log(`${patron.getMember().displayName} (${patron.getMember().id}) linked to ${username}`);
  }

  private async denyProfileButtonClick(patron: Patron) {
    if (await patron.getLinkStatus(this.database) !== linkStatuses.waitingOnConfirmation) return;

    patron.setLinkStatus(linkStatuses.waitingForLink, this.database);
    patron.sendMessage({
      embeds: [denyProfileTryAgainEmbed]
    });
  }

  private async removeLinkButtonClick(patron: Patron) {
    if (await patron.getLinkStatus(this.database) !== linkStatuses.linked) return;

    patron.setLinkStatus(linkStatuses.invited, this.database);
    patron.sendMessage({
      embeds: [removedLinkEmbed],
      components: [new MessageActionRow().addComponents(
        addLink
      )]
    });
  }

  // messageCreate event
  private async messageCreateEvent(message: Message) {
    if (message.guild !== null || message.channel.type !== "DM") return;

    let member = await this.client.getMainGuildMember(message.author);
    let patron = this.client.getPatron(member);
    
    let linkStatus = await patron.getLinkStatus(this.database);
    if (linkStatus !== linkStatuses.waitingForLink) return;

    let matches = message.content.match(userRegex);
    if (!matches) {
      patron.sendMessage({
        embeds: [ invalidLinkEmbed(message.content) ]
      });
      return;
    }

    let userId = matches[0];
    let exists = await this.vrChat.userExists(userId);
    
    if (!exists) {
      patron.sendMessage({
        embeds: [ invalidUseridEmbed(userId) ]
      });
      return;
    }

    let username = await this.vrChat.getUsernameFromId(userId);
    let avatar = await this.vrChat.getAvatarFromId(userId);

    patron.setLinkStatus(linkStatuses.waitingOnConfirmation, this.database);
    patron.setConfirmationProfileId(userId, this.database);

    patron.sendMessage({
      embeds: [ confirmUser(username, avatar, userId) ],
      components: [new MessageActionRow().addComponents(
        addProfileYes, addProfileNo
      )]
    });
  }

}