import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageCreateOptions
} from "discord.js";
import { VRChatUser } from "../types";
import colours from "./colours";

export const buttonIds = {
  addLinkId: "USER_add-vrc-link",
  cancelConfirm: "USER_cancel-confirm",
  unlink: "USER_unlink",
};

export const welcomeMessage = {
  embeds: [
    new EmbedBuilder()
      .setColor(colours.blue)
      .setTitle("Welcome!")
      .setDescription(
        "Thanks for becoming a patron! In order to give you proper rewards inside the world, we'll need a link to your VRChat profile.\nPlease click the button below to get started with the setup!\n> Want help? Look [here](https://docs.google.com/document/d/19o0WiEGXCdBuMgOXHpb4brQJs8-0boYlWiZHtLc1i2M/edit)!"
      )
      .setFooter({
        text: "Cannot see the button? Update your Discord client!"
      })
  ],
  components: [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(buttonIds.addLinkId)
        .setLabel("Link profile")
        .setEmoji("🔗")
        .setStyle(ButtonStyle.Primary)
    )
  ]
} satisfies MessageCreateOptions;

export const sendNameOrIdMessage = {
  embeds: [
    new EmbedBuilder()
      .setColor(colours.green)
      .setTitle("Setup your profile")
      .setDescription("To setup your profile, please send your VRChat username below.")
  ]
} satisfies MessageCreateOptions;

export const invalidIdMessage = {
  embeds: [
    new EmbedBuilder()
      .setColor(colours.red)
      .setTitle("Invalid Profile Link")
      .setDescription("The link you provided is invalid. Please try again.\n> If you do not know your profile URL, you can also send your VRChat username.")
      .setFooter({
        text: "If this issue persists, please contact an admin."
      })
  ]
} satisfies MessageCreateOptions;

export function confirmProfileMessage({ name, id, avatar, bio, lastActivePlatform }: VRChatUser) {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(colours.yellow)
        .setTitle("Confirm your profile")
        .setDescription("Please confirm your VRChat profile to complete the link."),
      new EmbedBuilder()
        .setColor(colours.none)
        .setTitle(name)
        .setThumbnail(avatar)
        .setDescription(`> ${bio ? bio.split("\n").join("\n> ") : "_No bio_"}\n\n**Last active platform:** ${lastActivePlatform === "standalonewindows" ? "Windows" : lastActivePlatform}\n[VRChat profile](https://vrchat.com/home/user/${id})`)
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`USER_confirm_${id}`)
          .setLabel("Yes")
          .setEmoji("✔️")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(buttonIds.cancelConfirm)
          .setLabel("No")
          .setEmoji("✖️")
          .setStyle(ButtonStyle.Danger)
      )
    ]
  } satisfies MessageCreateOptions;
};

export const noUsernameResultsMessage = {
  embeds: [
    new EmbedBuilder()
      .setColor(colours.red)
      .setTitle("No results found")
      .setDescription("No results were found for the username you provided. Please try again.\n> You can also send your profile URL. If you need help, look [here](https://docs.google.com/document/d/19o0WiEGXCdBuMgOXHpb4brQJs8-0boYlWiZHtLc1i2M/edit).")
      .setFooter({
        text: "If this issue persists, please contact an admin."
      })
  ]
} satisfies MessageCreateOptions;

export function selectUsersSearchResult(users: VRChatUser[]) {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(colours.yellow)
        .setTitle("Select your profile")
        .setDescription(`Found ${users.length} results. Please select the correct profile from the list below. If you do not see your profile, click the cancel button.\n> You can also send your profile URL. If you need help, look [here](https://docs.google.com/document/d/19o0WiEGXCdBuMgOXHpb4brQJs8-0boYlWiZHtLc1i2M/edit).`),

      ...users.map((user) => {
        return new EmbedBuilder()
          .setColor(colours.none)
          .setTitle(user.name)
          .setThumbnail(user.avatar)
          .setDescription(`> ${user.bio ? user.bio.split("\n").join("\n> ") : "_No bio_"}\n\n**Last active platform:** ${user.lastActivePlatform === "standalonewindows" ? "Windows" : user.lastActivePlatform}\n[VRChat profile](https://vrchat.com/home/user/${user.id})`);
      })
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        users.map(user => new ButtonBuilder()
          .setCustomId(`USER_confirm_${user.id}`)
          .setLabel(user.name)
          .setStyle(ButtonStyle.Success)
        )
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(buttonIds.cancelConfirm)
          .setLabel("Cancel")
          .setEmoji("✖️")
          .setStyle(ButtonStyle.Danger)
      )
    ]
  } satisfies MessageCreateOptions;
};

export const canceledLinkMessage = {
  embeds: [
    new EmbedBuilder()
      .setColor(colours.red)
      .setTitle("Canceled")
      .setDescription("Profile selection is canceled. You can try again by pasting your VRChat profile URL or sending your username.")
  ]
} satisfies MessageCreateOptions;

export function linkSuccessMessage({ name }: VRChatUser) {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(colours.green)
        .setTitle("Success!")
        .setDescription(`You have successfully linked your VRChat profile to your Discord account! Welcome, **${name}**!\n> To link your account to a different VRChat account, click the button below.`)
        .setFooter({
          text: "It can take up to five minutes for changes to take effect."
        })
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(buttonIds.unlink)
          .setLabel("Remove link")
          .setEmoji("❌")
          .setStyle(ButtonStyle.Secondary)
      )
    ]
  } satisfies MessageCreateOptions;
};

export const unlinkSuccessMessage = {
  embeds: [
    new EmbedBuilder()
      .setColor(colours.red)
      .setTitle("Profile unlinked")
      .setDescription("Your VRChat profile has been unlinked from your Discord account. You can link your profile again by clicking the button below.")
  ],
  components: [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(buttonIds.addLinkId)
        .setLabel("Add link")
        .setEmoji("🔗")
        .setStyle(ButtonStyle.Primary)
    )
  ]
} satisfies MessageCreateOptions;

export function dmClosedMessage(userId: string) {
  return {
    content: `<@${userId}>, your DMs are closed. Please enable them to link your VRChat account. After that, click the button below to reset your link state to receive a DM.`,
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`DM_CLOSED_${userId}`)
            .setLabel("Reset link state")
            .setStyle(ButtonStyle.Primary)
        )
    ]
  } satisfies MessageCreateOptions;
};