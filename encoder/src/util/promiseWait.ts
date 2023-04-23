export default function promiseWait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
