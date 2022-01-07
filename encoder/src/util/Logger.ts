import { createWriteStream, existsSync, WriteStream } from "fs";
import { mkdir } from "fs/promises";
import path = require("path");
import { inspect } from "util";
import { LoggerOptions } from "../VrcPatreonLinkTypes";

// This isn't log4j, so this video isn't really helpful: https://youtu.be/NIH6j7-w198
export default class Logger {

  private loggerTimezone: string;
  private writeStream: WriteStream;

  constructor(options: LoggerOptions) {
    if (!options.enabled) return;
    this.loggerTimezone = options.timezone;

    this._createWriteStream().then(() => {
      this._overrideConsoleMethods();
    });
  }

  private _overrideConsoleMethods(): void {
    let oldLog = console.log;
    console.log = (log: any) => {
      oldLog(log);
      let parsedLog = inspect(log, {
        showHidden: true,
        depth: null
      });
      this.writeStream.write(`[${this.getDateFormat()}] [LOG] ${parsedLog}\n`);
    }
    
    let oldWarn = console.warn;
    console.warn = (log: any) => {
      oldWarn(log);
      let parsedLog = inspect(log, {
        showHidden: true,
        depth: null
      });
      this.writeStream.write(`[${this.getDateFormat()}] [WARN] ${parsedLog}\n`);
    }
    
    let oldDebug = console.debug;
    console.debug = (log: any) => {
      oldDebug(log);
      let parsedLog = inspect(log, {
        showHidden: true,
        depth: null
      });
      this.writeStream.write(`[${this.getDateFormat()}] [DEBUG] ${parsedLog}\n`);
    }
  }

  private async _createWriteStream(): Promise<void> {
    let mainLogsDirectory = path.join(process.cwd(), "logs");
    let filepath = path.join(process.cwd(), "logs", `${this.getFilenameDate()}.log`);

    if (!existsSync(mainLogsDirectory)) await mkdir(mainLogsDirectory);
    this.writeStream = createWriteStream(filepath);
  }

  private getFilenameDate(): string {
    let date = new Date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}`;
  }

  private getDateFormat(): string {
    return new Date().toLocaleString("nl-NL", { timeZone: this.loggerTimezone });
  }

}