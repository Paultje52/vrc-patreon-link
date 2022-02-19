import VrChatUploader from "./VrChatUploader";
import { userDataCache, VrChatUploaderOptions } from "../VrcPatreonLinkTypes";
import { parser } from "html-metadata-parser";
import fetch from "node-fetch";

export default class VrChat {

  private uploader: VrChatUploader;
  private userdataCache: Map<String, userDataCache> = new Map<String, userDataCache>();

  constructor(uploaderOptions: VrChatUploaderOptions) {
    this.uploader = new VrChatUploader(uploaderOptions);
  }

  public async upload(imagePath: string): Promise<boolean> {
    let res = await this.uploader.upload(imagePath)
      .catch((e) => {
        console.warn(e);
        return false;
      });

    return res;
  }

  private async _getUserdata(vrChatUserId: string): Promise<userDataCache> {

    if (this.userdataCache.has(vrChatUserId)) {
      let cachedUserdata = this.userdataCache.get(vrChatUserId);
      if (Date.now()-(1000*60*60) < cachedUserdata.cacheTime) return cachedUserdata;
    }
    
    let apiKey = this.uploader.getSavedApiKey();
    let headers = await this.uploader.getParsedLoginHeaders();
    let res = await fetch(`https://api.vrchat.cloud/api/1/users/${vrChatUserId}?apiKey=${apiKey}`, {
      headers
    });

    let json = await res.json();
    let username = json.displayName;
    let avatarLink = json.currentAvatarImageUrl;

    this.userdataCache.set(vrChatUserId, {
      cacheTime: Date.now(),
      username,
      avatarLink
    });

    return {
      cacheTime: Date.now(),
      username,
      avatarLink
    };
    
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