import fetch, { RequestInit, Response } from "node-fetch";
import { readFile, writeFile, stat } from "fs/promises";
import { createReadStream } from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { VrChatUploaderOptions } from "../VrcPatreonLinkTypes";
import vrChatUrls from "./VrChatUrls";

export default class VrChatUploader {

  private baseUrl = vrChatUrls.base;
  private initialHeaders = {
    "accept": "*/*",
    "Content-Type": "application/json;charset=utf-8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
  };

  private options: VrChatUploaderOptions;
  private apiKey: string;

  constructor(options: VrChatUploaderOptions) {
    this.options = options;

    this.getApiKey().then((apiKey) => {
      if (!apiKey) console.warn("Cannot fetch API key! Please restart the bot to try again!");
      this.apiKey = apiKey;
    });
  }

  public async upload(imagePath: string): Promise<boolean> {

    if (!this.apiKey) {
      console.warn("Cannot upload image: API key is not set! Please restart the bot");
      return false;
    }

    console.debug(`Uploading ${imagePath} to VRChat!`);

    // Get saved cookie
    let cookie: string;
    try {
      cookie = await this.readCookieFile();
    } catch(e) {}

    // Check if the cookie is valid
    if (!cookie || !(await this.isValidCookie(cookie))) {
      console.debug("Cookie is invalid, logging in again...");
      // Login
      let rawCookieData = await this.login(this.options.username, this.options.password);
      if (!rawCookieData) return false;

      cookie = this.parseCookies(rawCookieData);

      // Save it for the next time
      await this.writeCookieFile(cookie);

    } else console.debug("Cookie is valid, using it...");

    // Request headers
    let headers = {
      ...this.initialHeaders,
      cookie
    };

    // Get previous image
    let prevAvatar = await this.getAvatar(headers, this.options.avatarId);
    if (!prevAvatar) return false;
    console.debug("Got previous avatar");

    // Pregenerate hash and fileId for the upload
    let md5Hash = await this.getFileMd5(imagePath);
    let fileId = this.extractFileId(prevAvatar.imageUrl);
    console.debug("Fileinfo generated");

    // Start file upload
    let fileVersion: string;
    let failed = false;

    try {
      let fetchedNewFileVersion = await this.startFileUpload(headers, md5Hash, imagePath, fileId)
        .catch((e) => {
          console.warn(`Create new file version error: ${e}`);
        });
      console.debug(`Fetched new file version: ${fetchedNewFileVersion}`);

      // The new version creation somehow failed - Let's delete and try again!
      if (!fetchedNewFileVersion) {
        console.warn("Failed to create new file version, deleting and trying again...");

        let latestVersion = await this.getLatestFileVersion(headers, fileId)
          .catch((e) => {throw new Error(e)});
        if (!latestVersion) return false;

        await this.deleteLatestVersion(headers, fileId, latestVersion)
          .catch((e) => {throw new Error(e)});
        
        return false;
      }
      
      fileVersion = fetchedNewFileVersion;

      let uploadUrl = await this.getUploadUrl(headers, fileId, fileVersion)
        .catch((e) => {throw new Error(e)});
      if (!uploadUrl) return false;

      console.debug(`Uploading to ${uploadUrl}`);

      let uploadSuccess = await this.uploadImage(uploadUrl, imagePath, md5Hash, headers)
        .catch((e) => {throw new Error(e)});

      if (!uploadSuccess) return false;
      console.debug("Image uploaded, cleaning up...");

    } catch (e) {
      console.warn(e);
      failed = true;
    }
      
    // Finish the upload
    if (!
      await this.finishUpload(headers, fileId, fileVersion)
    ) return false;
    if (!
      await this.finishSignatureUpload(headers, fileId, fileVersion)
    ) return false;

    // Check if it's failed
    if (failed) return false;

    // Update current image
    let newImageUrl = await this.updateCurrentImage(headers, this.options.avatarId, fileId, fileVersion);
    if (!newImageUrl) return false;

    // Check if the upload was successful!
    return prevAvatar.imageUrl !== newImageUrl;

  }

  private getCookiePath(): string {
    return path.join(__dirname, "cookie.tmp");
  }

  private async readCookieFile(): Promise<string> {
    return await readFile(this.getCookiePath(), "utf8");
  }
  
  private async fetch(url: string, options?: RequestInit): Promise<Response | undefined> {
    let fetchUrl = this.baseUrl + url;
    let res = await fetch(fetchUrl, options);

    if (!res.status.toString().startsWith("2")) {
      let json = await res.json();
      console.warn(`Failed to fetch ${url}: (${res.status} ${res.statusText})${json.error.message}`);
      return undefined;
    }

    return res;
  }

  private async isValidCookie(cookie: string): Promise<boolean> {
    let headers = {
      ...this.initialHeaders,
      cookie
    };

    let res = await this.fetch(vrChatUrls.checkAuth, { headers });
    if (!res) return false;

    let json = await res.json();    
    return json.ok;
  }

  private async writeCookieFile(cookie: string): Promise<void> {
    await writeFile(this.getCookiePath(), cookie, { encoding: "utf8" });
  }

  private async getApiKey(): Promise<string | undefined> {
    let res = await this.fetch(vrChatUrls.config);
    if (!res) return;

    let json: any = await res.json();
    return json.clientApiKey;
  }

  private async login(username: string, password: string): Promise<string[] | undefined> {

    let auth = Buffer.from(`${encodeURIComponent(username)}:${encodeURIComponent(password)}`).toString("base64");
    let res = await this.fetch(vrChatUrls.login(this.apiKey), {
      headers: {
        Authorization: `Basic ${auth}`,
        ...this.initialHeaders
      }
    });

    if (!res) return;
    return res.headers.raw()["set-cookie"];
  }

  private parseCookies(setCookiesHeader: string[]): string {
    return setCookiesHeader.map((entry) => {
      let parts = entry.split(";");
      let cookiePart = parts[0];
      return cookiePart;
    }).join(";");
  }

  private async getAvatar(headers: any, avatarId: string): Promise<any> {
    let res = await this.fetch(vrChatUrls.avatar(avatarId), {
      headers
    });
    if (!res) return;

    let json: any = await res.json();
    return json;
  }

  private getFileMd5(imagePath: string): Promise<string> {

    return new Promise((resolve) => {

      let shasum = crypto.createHash("md5");
      let readStream = createReadStream(imagePath);

      readStream.on("data", (data) => {
        shasum.update(data);
      });
      readStream.on("end", () => {
        let hash = shasum.digest("base64");
        resolve(hash);
      });

    });
  }

  private extractFileId(fullPath: string): string {
    let match = fullPath.match(/file_[0-9A-Za-z-]+/);
    
    if (!match) throw new Error("Cannot upload image: Failed to extract fileId");
    return match[0];
  }

  private async startFileUpload(headers: any, md5Hash: string, imagePath: string, fileId: string): Promise<string | undefined> {

    let fileSize = await this.getFilesize(imagePath);
    let signatureSize = Math.floor(Math.random() * (10000 - 500 + 1)) + 500;

    let res = await this.fetch(vrChatUrls.file(fileId), {
      method: "POST",
      headers,
      body: JSON.stringify({
        fileMd5: md5Hash,
        fileSizeInBytes: fileSize,
        signatureMd5: md5Hash,
        signatureSizeInBytes: signatureSize
      })
    });
    if (!res) return;

    let json = await res.json();
    return json.versions[json.versions.length-1].version;
  }

  private async getLatestFileVersion(headers: any, fileId: string): Promise<string | undefined> {
    let res = await this.fetch(vrChatUrls.file(fileId), {
      headers
    });
    if (!res) return;

    let json = await res.json();
    return json.versions[json.versions.length-1].version;
  }

  private async deleteLatestVersion(headers: any, fileId: string, latestVersion: string): Promise<void> {
    await this.fetch(vrChatUrls.fileVersion(fileId, latestVersion), {
      headers,
      method: "DELETE"
    });
  }

  private async getFilesize(imagePath: string): Promise<number> {
    let stats = await stat(imagePath);
    return stats.size;
  }

  private async getUploadUrl(headers: any, fileId: string, fileVersion: string): Promise<string | undefined> {
    let res = await this.fetch(vrChatUrls.startFileUpload(fileId, fileVersion), {
      method: "PUT",
      headers
    });
    if (!res) return;

    let json = await res.json();
    return json.url;
  }

  private async uploadImage(uploadUrl: string, imagePath: string, md5Hash: string, headers: any): Promise<boolean> {
    let rawFile = await this.getFile(imagePath);

    let res = await fetch(uploadUrl, {
      method: "PUT",
      body: rawFile,
      headers: {
        "User-Agent": headers["User-Agent"],
        "Content-MD5": md5Hash,
        "Content-Type": "image/png"
      }
    });

    return res ? res.status.toString().startsWith("2") : false;
  }

  private async getFile(imagePath: string): Promise<Buffer> {
    return await readFile(imagePath);
  }

  private async finishUpload(headers: any, fileId: string, fileVersion: string): Promise<boolean> {
    let res = await this.fetch(vrChatUrls.finishFileUpload(fileId, fileVersion), {
      method: "PUT",
      headers,
      body: JSON.stringify({
        maxParts: 0,
        nextPartNumber: 0
      })
    });

    return res ? res.status.toString().startsWith("2") : false;
  }

  private async finishSignatureUpload(headers: any, fileId: string, fileVersion: string): Promise<boolean> {
    let res = await this.fetch(vrChatUrls.finishSignatureUpload(fileId, fileVersion), {
      method: "PUT",
      headers,
      body: JSON.stringify({
        maxParts: 0,
        nextPartNumber: 0
      })
    });

    return res ? res.status.toString().startsWith("2") : false;
  } 

  private async updateCurrentImage(headers: any, avatarId: string, fileId: string, fileVersion: string): Promise<string | undefined> {
    let res = await this.fetch(vrChatUrls.avatar(avatarId), {
      method: "PUT",
      headers,
      body: JSON.stringify({
        id: avatarId,
        imageUrl: vrChatUrls.base + vrChatUrls.fileVersionFile(fileId, fileVersion)
      })
    });

    if (!res) return;
    return (<any> await res.json()).imageUrl;
  }

}