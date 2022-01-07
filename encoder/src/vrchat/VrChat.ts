import VrChatUploader from "./VrChatUploader";
import { userDataCache, VrChatUploaderOptions } from "../VrcPatreonLinkTypes";
import { parser } from "html-metadata-parser";

export default class VrChat {

  private uploader: VrChatUploader;
  private userdataCache: Map<String, userDataCache> = new Map<String, userDataCache>();

  constructor(uploaderOptions: VrChatUploaderOptions) {
    this.uploader = new VrChatUploader(uploaderOptions);
  }

  public upload(imagePath: string): Promise<boolean> {
    return this.uploader.upload(imagePath);
  }

  private async _getUserdata(vrChatUserId: string): Promise<userDataCache> {

    if (this.userdataCache.has(vrChatUserId)) {
      let cachedUserdata = this.userdataCache.get(vrChatUserId);
      if (Date.now()-(1000*60*30) < cachedUserdata.cacheTime) return cachedUserdata;
    }
    
    let data = await parser(`https://vrchat.com/home/user/${vrChatUserId}`);

    let username: string;
    if (data && data.og && data.og.title) username = data.og.title;

    let avatarLink: string;
    if (data && data.og && data.og.image) avatarLink = data.og.image;

    this.userdataCache.set(vrChatUserId, {
      cacheTime: Date.now(),
      username,
      avatarLink
    });

    return this.userdataCache.get(vrChatUserId);
    
  }
  
  public async userExists(vrChatUserId: string): Promise<boolean> {
    let res = await this._getUserdata(vrChatUserId);

    return res.avatarLink !== "https://assets.vrchat.com/www/images/default_social_image.jpg";
  }

  public async getUsernameFromId(vrChatUserId: string): Promise<string> {
    let res = await this._getUserdata(vrChatUserId);
    return res.username;
  }
  
  public async getAvatarFromId(vrChatUserId: string) {
    let res = await this._getUserdata(vrChatUserId);
    return res.avatarLink;
  }

}