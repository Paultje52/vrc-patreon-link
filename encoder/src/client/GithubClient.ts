import axios, { AxiosRequestConfig } from "axios";
import getCommitMessage from "../util/getCommitMessage";

export default class GithubClient {

  private apiToken = process.env.GITHUB_API_TOKEN!;
  private repo = process.env.GITHUB_REPO!;
  private file = process.env.GITHUB_FILE!;

  private cachedSha = "";

  private fetch(path: string, config: AxiosRequestConfig = {}) {
    return axios({
      ...config,
      url: `https://api.github.com${path}`,
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Accept": "application/vnd.github+json"
      }
    })
  }

  private async getSha() {
    const res = await this.fetch(`/repos/${this.repo}/contents/${this.file}`)
      .catch((err) => {
        return err.response;
      });

    this.cachedSha = res.status.toString().startsWith("2") ? res.data.sha : "";
    return this.cachedSha;
  }

  public async updateFile(content: string) {
    const sha = this.cachedSha || await this.getSha();
    const message = getCommitMessage() + "\n\nThis is an automated commit made by VRC-Patreon-Link to update the patreons list.\nhttps://github.com/Paultje52/vrc-patreon-link";
    const base64Content = Buffer.from(content).toString("base64");

    const res = await this.fetch(`/repos/${this.repo}/contents/${this.file}`, {
      method: "PUT",
      data: JSON.stringify({
        message,
        sha,
        content: base64Content,
        committer: {
          name: "VRC Patreon Link",
          email: "octocat@github.com"
        }
      })
    }).catch((err) => {
      return err.response;
    });

    if (res.data?.content?.sha) this.cachedSha = res.data.content.sha;
    return res.status.toString().startsWith("2");
  }

}