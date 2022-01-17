import { GuildMember, Message, MessageOptions } from "discord.js";
import * as Keyv from "keyv";

const linkStatuses = {
  notInvited: 0,
  invited: 1,
  waitingForLink: 2,
  waitingOnConfirmation: 3,
  linked: 4
}

export default class Patron {

  private member: GuildMember;

  constructor(member: GuildMember) {
    this.member = member;
  }

  public getMember(): GuildMember {
    return this.member;
  }

  public async sendMessage(message: MessageOptions): Promise<Message> {
    return await this.member.send(message);
  }

  public async getLinkStatus(database: Keyv): Promise<number> {
    let user = await database.get(this.member.id);
    /*
      DATABASE FORMAT - VALUE OF USER.ID
      undefined - nothing
      1 - disabled (Invite sent, user needs to accept before they can link)
      2 - has been sent a message and waiting to link
      3 - Waiting on confirmation
      <USER_ID> (String) - VRChat profile ID
    */

    if (user === undefined || user === 0) return linkStatuses.notInvited;
    else if (user === 1) return linkStatuses.invited;
    else if (user === 2) return linkStatuses.waitingForLink;
    else if (user === 3) return linkStatuses.waitingOnConfirmation;
    else return linkStatuses.linked;
  }

  public async setLinkStatus(status: number, database: Keyv): Promise<void> {
    if (status === linkStatuses.linked) throw new Error("Cannot set link status to linked. Try using Patron#setUserid instead.");

    await database.set(this.member.id, status);
  }

  public async setUserid(vrChatUserId: string, database: Keyv): Promise<void> {
    await database.set(this.member.id, vrChatUserId);
  }
  
  public async setConfirmationProfileId(userId: string, database: Keyv) {
    await database.set("tmp-profile-id."+this.member.id, userId);
  }
  public async getConfirmationProfileId(database: Keyv) {
    return await database.get("tmp-profile-id."+this.member.id);
  }
  public async removeConfirmationProfileId(database: Keyv) {
    await database.delete("tmp-profile-id."+this.member.id);
  }

}

export {
  linkStatuses
}