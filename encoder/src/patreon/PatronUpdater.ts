import { unlink, writeFile } from "fs/promises";
import * as Keyv from "keyv";
import path = require("path");
import DiscordClient from "../discord/DiscordClient";
import imageEncoder from "../imageEncoder/imageEncoder";
import Patron, { linkStatuses } from "./Patron";
import VrChat from "../vrchat/VrChat";

export default class PatronUpdater {

  private client: DiscordClient;
  private database: Keyv;
  private vrChat: VrChat;

  private isUpdating: boolean = false;
  private prevImageData: string | undefined;

  constructor(client: DiscordClient, database: Keyv, vrChat: VrChat) {
    this.client = client;
    this.database = database;
    this.vrChat = vrChat;
  }

  public async updatePatrons(): Promise<Patron[]> {
    let patrons = await this.client.fetchPatrons();
    let patronsToUpdate = [];

    for (let patron of patrons) {
      let link = await patron.getLinkStatus(this.database);
      if (link === linkStatuses.notInvited) patronsToUpdate.push(patron);
    }

    return patronsToUpdate;
  }

  public async syncWithVrChat(force?: boolean): Promise<void> {
    if (this.isUpdating && !force) return console.warn("Already syncing - Why are you trying to sync so fast?");
    this.isUpdating = true;
    console.debug("Syncing patrons with VRChat...");

    // Fetch members and roles from discord
    let guild = this.client.getMainGuild();
    let members = await guild.members.fetch();
    let roles = await this.client.getMainGuildPatronRoles();

    // Go through all members!
    let exportRoles = {};
    for (let member of Array.from(members.values())) {
      let vrChatId = await this.database.get(member.id);
      if (typeof vrChatId !== "string") continue; // Didn't link to vrchat (yet)

      // Get the vrchat user
      let username = await this.vrChat.getUsernameFromId(vrChatId);

      // Go through all roles and add the member where appropriate
      for (let role of Array.from(member.roles.cache.values())) {
        let patronRole = roles.get(role.id);
        if (!patronRole) continue;

        if (!exportRoles[patronRole.name]) exportRoles[patronRole.name] = [patronRole.name]; // The first element is always the role name, after that all the VRChat usernames
        exportRoles[patronRole.name].push(username);
      }
    }

    // Convert the exportRoles
    // The keys don't matter here, they are just needed during the indexing phase
    // For more information about the format, look at GitHub!
    let exportRolesString = this.convertExportRoles(exportRoles);
    if (!exportRolesString) {
      console.warn("No export roles found!");
      this.isUpdating = false;
      return;
    }
    if (exportRolesString === this.prevImageData && !force) {
      console.debug("No changes detected, skipping...");
      this.isUpdating = false;
      return;
    }
    this.prevImageData = exportRolesString;
    console.info(`==[EXPORT]==\n${exportRolesString}\n==[EXPORT]==`);

    // Let's use our beautiful code to export the data to an image. Want to know more? Look at GitHub!
    let exportPath = path.join(__dirname, "patrons-export.tmp.png");
    let imgData = imageEncoder(exportRolesString);
    await writeFile(exportPath, imgData);

    // Upload the image to vrchat
    let result = await this.vrChat.upload(exportPath);
    if (!result) console.warn("Couldn't upload the image to VRChat - automatically trying again in five minutes!");

    // Delete the image and cleanup!
    await unlink(exportPath);
    this.isUpdating = false;
    console.log("Patrons on VRChat are now up-to-date again!");
  }

  private convertExportRoles(exportRoles: { [key: string]: string[] }): string {
    let exportRolesString = <Array<string[]>> Object.values(exportRoles);
    return exportRolesString
      .map((patronTierMembers) => patronTierMembers.join("."))
      .join("\n");
  }

}