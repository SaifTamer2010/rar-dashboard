import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Force the in-process limiter: no Upstash credentials in the test env.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const { rateLimit, enforceRateLimit, clientKey } = await import("@/lib/rate-limit");

let seq = 0;
/** A fresh limiter name per test, so buckets never leak between cases. */
const fresh = () => `test-${++seq}`;

function req(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/x", { headers }) as any;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-30T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit (in-process fallback)", () => {
  it("allows up to the limit, then blocks", async () => {
    const name = fresh();
    const opts = { limit: 3, windowMs: 60_000 };

    for (let i = 0; i < 3; i++) {
      expect(await rateLimit(name, "1.1.1.1", opts)).toEqual({ ok: true });
    }
    const blocked = await rateLimit(name, "1.1.1.1", opts);
    expect(blocked.ok).toBe(false);
  });

  it("reports how long until the window resets", async () => {
    const name = fresh();
    const opts = { limit: 1, windowMs: 60_000 };

    await rateLimit(name, "ip", opts);
    vi.advanceTimersByTime(20_000);

    expect(await rateLimit(name, "ip", opts)).toEqual({ ok: false, retryAfter: 40 });
  });

  it("opens again once the window passes", async () => {
    const name = fresh();
    const opts = { limit: 1, windowMs: 60_000 };

    await rateLimit(name, "ip", opts);
    expect((await rateLimit(name, "ip", opts)).ok).toBe(false);

    vi.advanceTimersByTime(60_000);
    expect((await rateLimit(name, "ip", opts)).ok).toBe(true);
  });

  it("counts each client separately", async () => {
    const name = fresh();
    const opts = { limit: 1, windowMs: 60_000 };

    await rateLimit(name, "a", opts);
    expect((await rateLimit(name, "a", opts)).ok).toBe(false);
    expect((await rateLimit(name, "b", opts)).ok).toBe(true);
  });

  it("keeps separate budgets per limiter name", async () => {
    const opts = { limit: 1, windowMs: 60_000 };
    const signIn = fresh();
    const signUp = fresh();

    await rateLimit(signIn, "ip", opts);
    expect((await rateLimit(signIn, "ip", opts)).ok).toBe(false);
    expect((await rateLimit(signUp, "ip", opts)).ok).toBe(true);
  });
});

describe("clientKey", () => {
  it("takes the left-most x-forwarded-for entry", () => {
    expect(clientKey(req({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
  });

  it("falls back to x-real-ip", () => {
    expect(clientKey(req({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
  });

  it("buckets header-less callers together", () => {
    expect(clientKey(req())).toBe("unknown");
  });
});

describe("enforceRateLimit", () => {
  it("returns null under the limit and a 429 with Retry-After over it", async () => {
    const name = fresh();
    const opts = { limit: 1, windowMs: 60_000 };
    const r = req({ "x-forwarded-for": "5.5.5.5" });

    expect(await enforceRateLimit(r, name, opts)).toBeNull();

    const res = await enforceRateLimit(r, name, opts);
    expect(res?.status).toBe(429);
    expect(res?.headers.get("Retry-After")).toBe("60");
  });
});
