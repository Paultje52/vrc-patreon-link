import VrChatUploader from "./VrChatUploader";
import { userDataCache, VrChatUploaderOptions } from "../VrcPatreonLinkTypes";
import fetch from "node-fetch";

export default class VrChat {

  private uploader: VrChatUploader;
  private userdataCache: Map<String, userDataCache> = new Map<String, userDataCache>();
  private headers: any;
  private userFetchErrors = 0;
  private userFetchSuccess = 0;

  constructor(uploaderOptions: VrChatUploaderOptions) {
    this.uploader = new VrChatUploader(uploaderOptions);
    this.uploader.getParsedLoginHeaders().then((headers) => {
      this.headers = headers;
    });
  }

  public getErrorRate(): string {
    let total = this.userFetchErrors+this.userFetchSuccess;
    if (total === 0) return "_No fetches yet_";

    return `${this.userFetchErrors}/${total} - ${Math.round(this.userFetchErrors/total*10000)/100}%`;
  }

  public async upload(imagePath: string): Promise<boolean> {
    let res = await this.uploader.upload(imagePath)
      .catch((e) => {
        console.warn(e);
        return false;
      });

    return res;
  }

  private async _getUserdata(vrChatUserId: string): Promise<null | userDataCache> {

    if (this.userdataCache.has(vrChatUserId)) {
      let cachedUserdata = this.userdataCache.get(vrChatUserId);
      if (Date.now()-(1000*60*60) < cachedUserdata.cacheTime) return cachedUserdata;
    }
    
    let apiKey = this.uploader.getSavedApiKey();
    let res = await fetch(`https://api.vrchat.cloud/api/1/users/${vrChatUserId}?apiKey=${apiKey}`, {
      headers: this.headers
    });
    let text = await res.text();
    let json: any;
    
    try {
      if (!res.status.toString().startsWith("2")) throw new Error("No 2xx status code");
      json = JSON.parse(text);
    } catch (e) {
      console.warn(`Failed to fetch ${vrChatUserId}!` + e.toString());
      this.userFetchErrors++;
      return null;
    }

    this.userFetchSuccess++;
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
  
  public async userExists(vrChatUserId: string): Promise<null | boolean> {
    let res = await this._getUserdata(vrChatUserId);
    if (!res) return null;

    return res.avatarLink !== "https://assets.vrchat.com/www/images/default_social_image.jpg";
  }

  public async getUsernameFromId(vrChatUserId: string): Promise<null | string> {
    let res = await this._getUserdata(vrChatUserId);
    if (!res) return null;

    return res.username;
  }
  
  public async getAvatarFromId(vrChatUserId: string): Promise<null | string> {
    let res = await this._getUserdata(vrChatUserId);
    if (!res) return null;

    return res.avatarLink;
  }

}