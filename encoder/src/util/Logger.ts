import { createWriteStream, existsSync, WriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { inspect } from "util";
import { LoggerOptions } from "../VrcPatreonLinkTypes";

// This isn't log4j, so this video isn't really helpful: https://youtu.be/NIH6j7-w198
export default class Logger {

  private loggerTimezone: string;
  private writeStream: WriteStream;
  private _onLog: (log: string) => void = (_log: string) => {};

  constructor(options: LoggerOptions) {
    if (!options.enabled) return;
    this.loggerTimezone = options.timezone;

    this._createWriteStream().then(() => {
      this._overrideConsoleMethods();
    });
  }

  public onLog(func: (log: string) => void) {
    this._onLog = func;
  }

  private _overrideConsoleMethods(): void {
    let oldLog = console.log;
    console.log = (log: any) => {
      oldLog(log);
      let parsedLog = inspect(log, {
        showHidden: true,
        depth: null
      });
      parsedLog = `[LOG] ${parsedLog}\n`;

      this.writeStream.write(`[${this.getDateFormat()}] ${parsedLog}`);
      this._onLog(parsedLog)
    }
    
    let oldWarn = console.warn;
    console.warn = (log: any) => {
      oldWarn(log);
      let parsedLog = inspect(log, {
        showHidden: true,
        depth: null
      });
      parsedLog = `[WARN] ${parsedLog}\n`;

      this.writeStream.write(`[${this.getDateFormat()}] ${parsedLog}`);
      this._onLog(parsedLog)
    }
    
    let oldDebug = console.debug;
    console.debug = (log: any) => {
      oldDebug(log);
      let parsedLog = inspect(log, {
        showHidden: true,
        depth: null
      });
      parsedLog = `[DEBUG] ${parsedLog}\n`;

      this.writeStream.write(`[${this.getDateFormat()}] ${parsedLog}`);
      this._onLog(parsedLog)
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