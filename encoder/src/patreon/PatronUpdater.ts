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
  private lastSync: number;

  constructor(client: DiscordClient, database: Keyv, vrChat: VrChat) {
    this.client = client;
    this.database = database;
    this.vrChat = vrChat;
  }

  public resetSyncState(): void {
    this.prevImageData = undefined;
    this.lastSync = undefined;
  }

  public getLastSync(): number {
    return this.lastSync;
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

  public async getPatronList(): Promise<string> {
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
      let username: string;
      while (!username) {
        username = await this.vrChat.getUsernameFromId(vrChatId);

        if (!username) await new Promise((res) => setTimeout(res, 1000));
      }

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
    if (!exportRolesString || exportRolesString.length === 0) {
      console.warn("Nothing to upload yet!");
      return "";
    }

    return exportRolesString;
  }

  public async syncWithVrChat(force?: boolean): Promise<void> {
    if (this.isUpdating && !force) {
      if (Date.now() - this.getLastSync() < 1000 * 60 * 15) return console.warn("Already syncing - Why are you trying to sync so fast?");
      
      console.warn("Already syncing - Auto force sync because sync takes too long!");
      this.prevImageData = undefined;
    }
    else if (this.isUpdating) console.warn("Already syncing - Forcing the bot to do it again. If error occurs, please restart the bot!");
    this.isUpdating = true;
    console.debug("Syncing patrons with VRChat...");

    // Get export string
    let exportRolesString = await this.getPatronList();
    if (!exportRolesString || exportRolesString.length === 0) {
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
    if (!result) {
      console.warn("Couldn't upload the image to VRChat - automatically trying again in five minutes!");
      this.prevImageData = undefined; // Make sure we're uploading the image again!
    }

    // Delete the image and cleanup!
    await unlink(exportPath);
    this.isUpdating = false;
    this.lastSync = Date.now();
    if (result) console.log("Patrons on VRChat are now up-to-date again!");
  }

  private convertExportRoles(exportRoles: { [key: string]: string[] }): string {
    let exportRolesString = <Array<string[]>> Object.values(exportRoles);
    return exportRolesString
      .map((patronTierMembers) => patronTierMembers.join("."))
      .join("\n");
  }

}