import fetch from "node-fetch";
import { readFile, writeFile, stat } from "fs/promises";
import { createReadStream } from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { VrChatUploaderOptions } from "../VrcPatreonLinkTypes";

export default class VrChatUploader {

  private baseUrl = "https://api.vrchat.cloud/api/1";
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
      this.apiKey = apiKey;
    });
  }

  public async upload(imagePath: string): Promise<boolean> {

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

        await this.deleteLatestVersion(headers, fileId, latestVersion)
          .catch((e) => {throw new Error(e)});
        
        return false;
      }
      
      fileVersion = fetchedNewFileVersion;

      let uploadUrl = await this.getUploadUrl(headers, fileId, fileVersion)
        .catch((e) => {throw new Error(e)});
      console.debug(`Uploading to ${uploadUrl}`);

      await this.uploadImage(uploadUrl, imagePath, md5Hash, headers)
        .catch((e) => {throw new Error(e)});
      console.debug("Image uploaded, cleaning up...");

    } catch (e) {
      console.warn(e);
      failed = true;
    }
      
    // Finish the upload
    await this.finishUpload(headers, fileId, fileVersion);
    await this.finishSignatureUpload(headers, fileId, fileVersion);

    // Check if it's failed
    if (failed) return false;

    // Update current image
    let newImageUrl = await this.updateCurrentImage(headers, this.options.avatarId, fileId, fileVersion);

    // Check if the upload was successful!
    return prevAvatar.imageUrl !== newImageUrl;

  }

  private getCookiePath(): string {
    return path.join(__dirname, "cookie.tmp");
  }

  private async readCookieFile(): Promise<string> {
    return await readFile(this.getCookiePath(), "utf8");
  }

  private async isValidCookie(cookie: string): Promise<boolean> {
    let headers = {
      ...this.initialHeaders,
      cookie
    };

    let res = await fetch(this.baseUrl + "/auth", {
      headers
    });

    if (res.status !== 200) return false;

    let json = await res.json();    
    return json.ok;
  }

  private async writeCookieFile(cookie: string): Promise<void> {
    await writeFile(this.getCookiePath(), cookie, { encoding: "utf8" });
  }

  private async getApiKey(): Promise<string> {
    let res = await fetch(this.baseUrl + "/config");
    if (res.status !== 200) throw new Error("Cannot upload image: Failed to fetch config");

    let json: any = await res.json();
    return json.clientApiKey;
  }

  private async login(username: string, password: string): Promise<string[]> {

    let auth = Buffer.from(`${encodeURIComponent(username)}:${encodeURIComponent(password)}`).toString("base64");
    let res = await fetch(this.baseUrl + `/auth/user?apiKey=${this.apiKey}`, {
      headers: {
        Authorization: `Basic ${auth}`,
        ...this.initialHeaders
      }
    });

    if (res.status !== 200) throw new Error(`Cannot upload image: Failed to login: ${(await res.json()).error.message}`);
    return res.headers.raw()["set-cookie"];

  }

  private parseCookies(setCookiesHeader: string[]): string {
    return setCookiesHeader.map((entry) => {
      let parts = entry.split(";");
      let cookiePart = parts[0];
      return cookiePart;
    }).join(";");
  }

  private async getAvatar(headers: any, avatarId: String): Promise<any> {
    let res = await fetch(this.baseUrl + `/avatars/${avatarId}`, {
      headers
    });

    let json: any = await res.json();

    if (res.status === 404) throw new Error("Cannot upload image: Avatar not found");
    if (res.status !== 200) throw new Error("Cannot upload image: Failed to get avatar");

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

  private async startFileUpload(headers: any, md5Hash: string, imagePath: string, fileId: string): Promise<string> {

    let fileSize = await this.getFilesize(imagePath);
    let signatureSize = Math.floor(Math.random() * (10000 - 500 + 1)) + 500;

    let res = await fetch(this.baseUrl + `/file/${fileId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        fileMd5: md5Hash,
        fileSizeInBytes: fileSize,
        signatureMd5: md5Hash,
        signatureSizeInBytes: signatureSize
      })
    });

    let json = await res.json();
    if (res.status !== 200) throw new Error(`Cannot upload image: Failed to start file upload: ${json.error.message}`);

    return json.versions[json.versions.length-1].version;
  }

  private async getLatestFileVersion(headers: any, fileId: string): Promise<string> {
    let res = await fetch(this.baseUrl + `/file/${fileId}`, {
      headers
    });

    let json = await res.json();
    if (res.status !== 200) throw new Error(`Cannot upload image: Failed to start file upload: ${json.error.message}`);

    return json.versions[json.versions.length-1].version;
  }

  private async deleteLatestVersion(headers: any, fileId: string, latestVersion: string): Promise<void> {
    let res = await fetch(this.baseUrl + `/file/${fileId}/${latestVersion}`, {
      headers,
      method: "DELETE"
    });

    let json = await res.json();
    if (res.status !== 200) throw new Error(`Cannot upload image: Failed to start file upload: ${json.error.message}`);
  }

  private async getFilesize(imagePath: string): Promise<number> {
    let stats = await stat(imagePath);
    return stats.size;
  }

  private async getUploadUrl(headers: any, fileId: string, fileVersion: string): Promise<string> {
    let res = await fetch(this.baseUrl + `/file/${fileId}/${fileVersion}/file/start`, {
      method: "PUT",
      headers
    });

    if (res.status !== 200) throw new Error(`Cannot upload image: Failed to get upload url: ${(await res.json()).error.message} (Version now ${fileVersion})`);

    let json = await res.json();
    return json.url;
  }

  private async uploadImage(uploadUrl: string, imagePath: string, md5Hash: string, headers: any): Promise<void> {
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

    if (res.status !== 200) throw new Error("Cannot upload image: Failed while upload image");
  }

  private async getFile(imagePath: string): Promise<Buffer> {
    return await readFile(imagePath);
  }

  private async finishUpload(headers: any, fileId: string, fileVersion: string): Promise<void> {
    let res = await fetch(this.baseUrl + `/file/${fileId}/${fileVersion}/file/finish`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        maxParts: 0,
        nextPartNumber: 0
      })
    });

    if (res.status !== 200) throw new Error(`Cannot upload image: Failed to finish upload: ${(await res.json()).error.message}`);
  }
  
  private async finishSignatureUpload(headers: any, fileId: string, fileVersion: string): Promise<void> {
    let res = await fetch(this.baseUrl + `/file/${fileId}/${fileVersion}/signature/finish`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        maxParts: 0,
        nextPartNumber: 0
      })
    });

    if (res.status !== 200) throw new Error("Cannot upload image: Failed to finish signature upload");
  } 

  private async updateCurrentImage(headers: any, avatarId: string, fileId: string, fileVersion: string): Promise<string> {
    let res = await fetch(this.baseUrl + `/avatars/${avatarId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        id: avatarId,
        imageUrl: `${this.baseUrl}/file/${fileId}/${fileVersion}/file`
      })
    });

    if (res.status !== 200) throw new Error("Cannot upload image: Failed to update current image");

    return (<any> res.json()).imageUrl;
  }

}