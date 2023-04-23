import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, Message, MessageEditOptions, ModalBuilder, ModalSubmitInteraction, TextBasedChannel, TextInputBuilder, TextInputComponent, TextInputStyle } from "discord.js";
import DiscordClient from "./client/DiscordClient";
import VRChatClient from "./client/VRChatClient";
import colours from "./config/colours";

export default class AdminPanel {

  private discordClient: DiscordClient;
  private vrChatClient: VRChatClient;
  private channel?: TextBasedChannel;
  private message?: Message;

  constructor(discordClient: DiscordClient, vrChatClient: VRChatClient) {
    this.discordClient = discordClient;
    this.vrChatClient = vrChatClient;
  }

  /**
   * Initialize the AdminPanel
   */
  public async initialize() {
    const channelId = process.env.ADMIN_PANEL_CHANNEL_ID!;
    const messageId = process.env.ADMIN_PANEL_MESSAGE_ID;

    await this.fetchDiscord(channelId, messageId);
    this.updateMessage();
  }

  /**
   * Call when a button is clicked in the AdminPanel
   * @param {ButtonInteraction} interaction The interaction object
   */
  public buttonInteraction(interaction: ButtonInteraction) {
    if (interaction.customId === "ADMIN_provide-2fa") {
      const input = new TextInputBuilder()
        .setCustomId("ADMIN_provide-2fa-modal-input")
        .setMinLength(6)
        .setMaxLength(6)
        .setPlaceholder("123456")
        .setRequired(true)
        .setStyle(TextInputStyle.Short)
        .setLabel("Provide VRChat 2FA Token");

      const modal = new ModalBuilder()
        .setCustomId("ADMIN_provide-2fa-modal")
        .setTitle("Provide VRChat 2FA Token")
        .setComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));

      interaction.showModal(modal);
    }
  }

  /**
   * Call when a modal is submitted in the AdminPanel
   * @param {ModalSubmitInteraction} interaction The interaction object
   */
  public async modalInteraction(interaction: ModalSubmitInteraction) {
    if (interaction.customId === "ADMIN_provide-2fa-modal") {
      const textInput = interaction.components[0].components[0] as TextInputComponent;
      if (textInput.customId !== "ADMIN_provide-2fa-modal-input") return;

      await interaction.reply({ content: "Processing...", ephemeral: true });

      const token = textInput.value;
      const success = await this.vrChatClient.post2FA(token);

      interaction.editReply({
        content: success ? "Successfully logged into VRChat!" : "Invalid 2FA code. Please wait 15 minutes, restart the bot and try again."
      });
      this.updateMessage();
    }
  }

  private async fetchDiscord(channelId: string, messageId?: string): Promise<void> {
    const channel = await this.discordClient.channels.fetch(channelId);
    if (channel?.isTextBased()) this.channel = channel;
    else throw new Error("Failed to fetch AdminPanel channel.");

    if (messageId) this.message = await channel.messages.fetch(messageId);
    else {
      this.message = await channel.send("Loading...");
      console.log(`AdminPanel message ID: ${this.message.id} - SAVE THIS IN .env!`);
    }
  }

  private async updateMessage() {
    const authState = await this.vrChatClient.getAuthState()
      .catch((error) => {
        console.warn(error);
        return "LOGIN ERROR";
      });

    const components: MessageEditOptions["components"] = [];

    // VRChat API auth state
    const authMessage = typeof authState === "string" ? authState : authState ? "LOGGED IN" : "**PROVIDE 2FA TOKEN**";
    if (authState === false) {
      const button = new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setLabel("PROVIDE VRCHAT 2FA")
        .setCustomId("ADMIN_provide-2fa");
      components.push(
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(button)
      );
    }

    // Edit the message
    this.message?.edit({
      content: "",
      embeds: [
        new EmbedBuilder()
          .setTitle("Admin Panel")
          .setColor(colours.none)
          .setDescription(`VRChat Auth State: ${authMessage}`)
          .setTimestamp(new Date())
      ],
      components
    });
  }

}