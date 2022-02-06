import type Patron from "./patreon/Patron"

export type ClientOptions = {
  token: string;
  guild: string;
  roles: string;
  channel: string;
}

export type VrChatUploaderOptions = {
  username: string;
  password: string;
  avatarId: string;
}

export type userDataCache = {
  cacheTime: number;
  username: string;
  avatarLink: string;
}

export type LoggerOptions = {
  enabled: boolean;
  timezone: string;
}

export type LinkStatusses = {
  date: number,
  total: number,
  notLinkedYet: Patron[]
}