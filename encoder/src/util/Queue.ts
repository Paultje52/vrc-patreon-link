type Task = () => Promise<void>;

export default class Queue {
  private tasks: Task[] = [];
  private running = false;

  /**
   * Add a task to the queue
   * @param task The task to add to the queue
   * @memberof queue
   * @example queue.add(async () => {
   *  await doSomething();
   * });
   */
  public add(task: Task) {
    this.tasks.push(task);
    this.run();
  }

  /**
   * Run the queue
   * @private
   * @returns {Promise<void>} The promise to run the queue
   * @memberof Queue
   * @description This method is private and should not be called directly
   */
  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (this.tasks.length > 0) {
      const task = this.tasks.shift();
      if (task) await task();
    }

    this.running = false;
  }

  /**
   * Get the size of the queue
   * @returns {number} The size of the queue
   */
  public getSize(): number {
    return this.tasks.length;
  }
}
