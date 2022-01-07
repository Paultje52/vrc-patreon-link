export default class Queue {

  private interval: number;
  private queue: Array<Function>;
  private intervalInstance: NodeJS.Timer;

  constructor(interval: number) {
    if (!interval) interval = 500;
    this.interval = interval;
    this.queue = [];

    this.start();
  }

  add(func: Function) {
    this.queue.push(func);
  }

  clear() {
    this.queue = [];
  }

  stop() {
    clearInterval(this.intervalInstance);
  }

  start() {
    this.intervalInstance = setInterval(async () => {
      if (this.queue.length === 0) return;
      await this.queue[0]();
      this.queue.shift();
    }, this.interval);
  }
}