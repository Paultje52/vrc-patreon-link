import { readFileSync } from "fs";
import { join } from "path";

const path = join(__dirname, "commit_messages.txt");
const messages = readFileSync(path, "utf-8").split("\n").filter((m) => !m.startsWith("#"));

export default function getCommitMessage() {
  return messages[Math.floor(Math.random() * messages.length)];
}