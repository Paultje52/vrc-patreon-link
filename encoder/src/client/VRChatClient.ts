import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { VRChatUser } from "../types";
import parseSetCookie from "../util/parseSetCookie";

export default class VRChatClient {
  private lastApiKey = "";
  private lastApiKeyCheck = 0;

  private lastAuthState = false;
  private lastAuthStateCheck = 0;
  private required2FA = "";
  private authCookie = "";

  private userCache = new Map<string, { date: number, user: VRChatUser }>();

  private fetch(endpoint: string, config?: AxiosRequestConfig) {
    return axios({
      method: "GET",
      url: `https://api.vrchat.cloud/api/1${endpoint}`,
      ...config,

      headers: {
        "User-Agent": "VRC Patreon Link",
        "accept": "*/*",
        "Content-Type": "application/json;charset=utf-8",
        "Cookie": `auth=${this.authCookie};`,
        ...(config?.headers || {})
      }
    });
  }

  private async fetchApiKey() {
    // Check if we already checked the API key in the last 24 hours
    if (this.lastApiKeyCheck + 1000 * 60 * 60 * 24 > Date.now()) return this.lastApiKey;

    const res = await this.fetch("/config");
    const apiKey = res.data.apiKey;

    this.lastApiKey = apiKey;
    this.lastApiKeyCheck = Date.now();
    return apiKey;
  }

  /**
   * Check if the user is logged in. If not, it will try to login
   * @returns {Promise<boolean>} Whether the user is logged in (true means logged in, false means 2FA required and an error means invalid credentials)
   */
  public async getAuthState(): Promise<boolean> {
    // Check if we already checked the auth state in the last 24 hours
    if (this.lastAuthStateCheck + 1000 * 60 * 60 * 24 > Date.now()) return this.lastAuthState;

    if (!this.authCookie) this.authCookie = await this.loadAuthCookie();

    const username = encodeURIComponent(process.env.VR_CHAT_USERNAME!);
    const password = encodeURIComponent(process.env.VR_CHAT_PASSWORD!);
    const authentification = Buffer.from(`${username}:${password}`).toString("base64");

    const apiKey = await this.fetchApiKey();
    const res = await this.fetch(`/auth/user?apiKey=${apiKey}`, {
      headers: {
        "Authorization": `Basic ${authentification}`
      }
    }).catch((error: AxiosError) => {
      return error.response;
    });

    if (!res || res.status !== 200) {
      throw new Error("Unable to login into VRChat. Maybe you have the wrong username or password? Error: " + res?.data?.error);
    }

    if (res.data.requiresTwoFactorAuth) {
      console.warn("Provide your VRChat 2FA code using the Admin Panel in Discord!");
      this.required2FA = res.data.requiresTwoFactorAuth[0];

    } else if (res.status === 200) console.log(`Successfully logged into VRChat as ${res.data.displayName}!`)

    const setCookie = res.headers["set-cookie"];
    this.authCookie = parseSetCookie(setCookie?.toString() || "", "auth") || this.authCookie || "";

    this.lastAuthState = !res.data.requiresTwoFactorAuth;
    this.lastAuthStateCheck = Date.now();
    return this.lastAuthState;
  }

  /**
   * Login using a 2FA code via the mail or an app
   * @param code The 2FA code
   * @returns {Promise<boolean>} Whether the 2FA code was correct
   */
  public async post2FA(code: string): Promise<boolean> {
    const apiKey = await this.fetchApiKey();
    const res = await this.fetch(`/auth/twofactorauth/${this.required2FA}/verify?apiKey=${apiKey}`, {
      method: "POST",
      data: JSON.stringify({
        code
      })
    });

    const success = res.status.toString().startsWith("2") && res.data.verified;

    if (success) {
      this.lastAuthState = true;
      this.lastAuthStateCheck = Date.now();
      await this.saveAuthCookie(this.authCookie);
    }

    return success;
  }

  private async loadAuthCookie() {
    const path = join(__dirname, "..", "..", ".vrc-auth.env");
    const content = await readFile(path, "utf-8")
      .catch(() => "");

    return content;
  }
  private saveAuthCookie(authCookie: string) {
    const path = join(__dirname, "..", "..", ".vrc-auth.env");
    return writeFile(path, authCookie);
  }

  /**
   * Fetch a user based on their ID
   * @param {string} id The ID of the user to fetch
   * @returns {Promise<VRChatUser | null>} The user that was found
   */
  public async fetchUser(id: string): Promise<VRChatUser | null> {
    const cachedUser = this.userCache.get(id);
    if (cachedUser && cachedUser.date + 1000 * 60 * 60 * 24 > Date.now()) return cachedUser.user;

    const apiKey = await this.fetchApiKey();
    const res = await this.fetch(`/users/${id}?apiKey=${apiKey}`)
      .catch((error: AxiosError) => {
        return error.response;
      });
    if (res?.status !== 200) return null;

    const user = {
      name: res.data.displayName,
      id: res.data.id,
      avatar: res.data.currentAvatarImageUrl,
      bio: res.data.bio,
      lastActivePlatform: res.data.last_platform
    };

    this.userCache.set(id, { user, date: Date.now() });
    return user;
  }

  /**
   * Search for a user based on their name
   * @param {string} name The name of the user to search for
   * @returns {Promise<VRChatUser[] | null>} The users that were found
   */
  public async searchUser(name: string): Promise<VRChatUser[] | null> {
    const apiKey = await this.fetchApiKey();
    const res = await this.fetch(`/users?apiKey=${apiKey}&n=5&search=${encodeURIComponent(name)}`)
      .catch((error: AxiosError) => {
        return error.response;
      });

    if (res?.status !== 200) return null;
    return res.data.map((user: any) => ({
      name: user.displayName,
      id: user.id,
      avatar: user.currentAvatarImageUrl,
      bio: user.bio,
      lastActivePlatform: user.last_platform
    }));
  }
}