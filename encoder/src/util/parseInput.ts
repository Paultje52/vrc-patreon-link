export default function parseInput(input: string) {
  return input.split("\`").join("");
}