import { LINK_STATE } from "@prisma/client";
import DiscordClient from "../client/DiscordClient";
import promiseWait from "./promiseWait";

export default function ensureInvites(client: DiscordClient) {
  // Ensure that everyone is invited
  Array.from(client.getAllUsers().values()).forEach((user) => {
    // If the user is already invited, skip them
    if (user.getLinkState() !== LINK_STATE.NOT_INVITED) return;

    client.getQueue().add(async () => {
      const member = user.getDiscordMember();
      console.log(`Inviting ${member.displayName} (${member.id})...`);

      // Make sure the user's cached state is up to date
      await user.fetchState();
      // Check if the user still isn't invited (it's possible multiple tasks were queued for the same user)
      if (user.getLinkState() !== LINK_STATE.NOT_INVITED) return;
      // Invite the user - The user class handles the inviting process
      await user.invite();
      // Wait 20 seconds to prevent discord rate limiting
      await promiseWait(1000 * 20);
    });
  });
}
