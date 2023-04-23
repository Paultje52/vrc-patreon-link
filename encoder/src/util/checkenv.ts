import "dotenv/config";

// Check if the environment variables are set
if (!process.env.DISCORD_TOKEN) {
  console.error("DISCORD_TOKEN is not set!");
  process.exit(1);
}