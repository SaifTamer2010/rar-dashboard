import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * /api/pusher/auth is the only thing standing between a browser and another
 * team's live lead feed. These tests pin down that it signs exactly one channel:
 * the caller's own, resolved from the session.
 */

const auth = vi.fn();
const getViewerTeamId = vi.fn();
const authorizeChannel = vi.fn();

vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/team", () => ({ getViewerTeamId }));
vi.mock("@/lib/pusher-server", () => ({ pusherServer: { authorizeChannel } }));

const { POST } = await import("@/app/api/pusher/auth/route");

const OWN_TEAM = "team-own";
const OTHER_TEAM = "team-other";

function subscribe(fields: Record<string, string>) {
  const body = new URLSearchParams(fields);
  return new Request("http://localhost/api/pusher/auth", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }) as any;
}

beforeEach(() => {
  auth.mockResolvedValue({ user: { id: "u1", role: "agent" } });
  getViewerTeamId.mockResolvedValue(OWN_TEAM);
  authorizeChannel.mockReturnValue({ auth: "key:signature" });
});

describe("POST /api/pusher/auth", () => {
  it("signs the caller's own team channel", async () => {
    const res = await POST(
      subscribe({ socket_id: "1.2", channel_name: `private-leads-team-${OWN_TEAM}` }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ auth: "key:signature" });
    expect(authorizeChannel).toHaveBeenCalledWith("1.2", `private-leads-team-${OWN_TEAM}`);
  });

  it("refuses another team's channel", async () => {
    const res = await POST(
      subscribe({ socket_id: "1.2", channel_name: `private-leads-team-${OTHER_TEAM}` }),
    );

    expect(res.status).toBe(403);
    expect(authorizeChannel).not.toHaveBeenCalled();
  });

  it("refuses a channel that only starts with the caller's channel name", async () => {
    // Guards against someone swapping the exact match for startsWith().
    const res = await POST(
      subscribe({
        socket_id: "1.2",
        channel_name: `private-leads-team-${OWN_TEAM}-extra`,
      }),
    );

    expect(res.status).toBe(403);
    expect(authorizeChannel).not.toHaveBeenCalled();
  });

  it("refuses any other channel family", async () => {
    const res = await POST(
      subscribe({ socket_id: "1.2", channel_name: "private-admin-everything" }),
    );

    expect(res.status).toBe(403);
    expect(authorizeChannel).not.toHaveBeenCalled();
  });

  it("rejects a caller with no session", async () => {
    auth.mockResolvedValue(null);

    const res = await POST(
      subscribe({ socket_id: "1.2", channel_name: `private-leads-team-${OWN_TEAM}` }),
    );

    expect(res.status).toBe(401);
    expect(authorizeChannel).not.toHaveBeenCalled();
  });

  it("refuses a signed-in user who is on no team", async () => {
    getViewerTeamId.mockResolvedValue(null);

    const res = await POST(
      subscribe({ socket_id: "1.2", channel_name: `private-leads-team-${OWN_TEAM}` }),
    );

    expect(res.status).toBe(403);
    expect(authorizeChannel).not.toHaveBeenCalled();
  });

  it("resolves the team from the session user, not the request", async () => {
    await POST(
      subscribe({ socket_id: "1.2", channel_name: `private-leads-team-${OWN_TEAM}` }),
    );

    expect(getViewerTeamId).toHaveBeenCalledWith("u1");
  });

  it("returns 400 when socket or channel is missing", async () => {
    const noChannel = await POST(subscribe({ socket_id: "1.2" }));
    const noSocket = await POST(
      subscribe({ channel_name: `private-leads-team-${OWN_TEAM}` }),
    );

    expect(noChannel.status).toBe(400);
    expect(noSocket.status).toBe(400);
    expect(authorizeChannel).not.toHaveBeenCalled();
  });
});
