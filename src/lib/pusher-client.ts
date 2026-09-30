import Pusher from "pusher-js";

// Only constructed in the browser — building it on the server would open a socket
// during SSR. Every consumer uses it inside an effect, so the server-side value is
// never touched; it is typed as `Pusher` so those call sites stay unchanged.
export const pusherClient: Pusher =
  typeof window !== "undefined"
    ? new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        // Every `private-` subscription is signed by our own server first.
        // Without this, pusher-js has nothing to present and Pusher rejects the
        // subscription outright.
        authEndpoint: "/api/pusher/auth",
      })
    : null!;

/** Prefix of the per-team lead channels. The auth route matches on this. */
export const LEADS_CHANNEL_PREFIX = "private-leads-team-";

/**
 * Lead traffic fans out per team, matching what the dashboard actually shows —
 * /api/leads/stats counts the viewer's own team and nothing else. The single
 * global "leads-channel" meant every business heard every other business's
 * leads. Callers must take the id from the session or DB, never from the client:
 * the browser learns its own name from GET /api/leads/channel.
 *
 * The `private-` prefix is what makes this a lock rather than a guess. A public
 * channel is readable by anyone holding NEXT_PUBLIC_PUSHER_KEY, and that key
 * ships in the bundle — so the only thing between an ex-teammate and their old
 * team's live feed was remembering a team id, and ids never rotate. Pusher
 * refuses a `private-` subscription unless /api/pusher/auth signs it.
 */
export function leadsChannel(teamId: string) {
  return `${LEADS_CHANNEL_PREFIX}${teamId}`;
}
