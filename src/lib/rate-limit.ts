import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting for the public (unauthenticated) endpoints.
 *
 * Uses Upstash when UPSTASH_REDIS_REST_URL / _TOKEN are set — both packages are
 * already dependencies. With no Redis configured it falls back to an in-process
 * counter, which is genuinely weaker: it is per-instance, so N serverless
 * instances means N times the allowance, and it resets on cold start. That is
 * still far better than the nothing that was here before, but provision Redis
 * before treating these numbers as real.
 */

type Verdict = { ok: true } | { ok: false; retryAfter: number };

// ---------------------------------------------------------------------------
// In-process fallback: fixed window, bounded so a flood cannot grow it forever.
// ---------------------------------------------------------------------------

const MAX_TRACKED_KEYS = 10_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function localLimit(key: string, limit: number, windowMs: number): Verdict {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) sweep(now);
    // Still full after a sweep? Every key is live, so fail closed rather than
    // let the map grow without bound.
    if (buckets.size >= MAX_TRACKED_KEYS) return { ok: false, retryAfter: 60 };

    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Upstash, loaded lazily so the packages stay out of the bundle when unused.
// ---------------------------------------------------------------------------

type UpstashLimiter = { limit: (key: string) => Promise<{ success: boolean; reset: number }> };

const upstashCache = new Map<string, Promise<UpstashLimiter | null>>();

function getUpstash(name: string, limit: number, windowMs: number) {
  const cached = upstashCache.get(name);
  if (cached) return cached;

  const created = (async (): Promise<UpstashLimiter | null> => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null;
    }
    try {
      const [{ Ratelimit }, { Redis }] = await Promise.all([
        import("@upstash/ratelimit"),
        import("@upstash/redis"),
      ]);
      return new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        prefix: `rl:${name}`,
        analytics: false,
      });
    } catch (error) {
      console.error("rate-limit: Upstash unavailable, using in-process limiter", error);
      return null;
    }
  })();

  upstashCache.set(name, created);
  return created;
}

// ---------------------------------------------------------------------------

/**
 * Best-effort client identity. `x-forwarded-for` is spoofable in general, but
 * on Vercel and behind most proxies the left-most entry is set by the edge and
 * is the usable signal we have without a session.
 */
export function clientKey(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip");
  return ip || "unknown";
}

export async function rateLimit(
  name: string,
  identifier: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<Verdict> {
  const upstash = await getUpstash(name, limit, windowMs);

  if (upstash) {
    try {
      const result = await upstash.limit(identifier);
      if (result.success) return { ok: true };
      return {
        ok: false,
        retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      };
    } catch (error) {
      // Redis being down must not take sign-in down with it.
      console.error("rate-limit: Upstash call failed, falling back", error);
    }
  }

  return localLimit(`${name}:${identifier}`, limit, windowMs);
}

/**
 * Guards a route handler. Returns a 429 response to return as-is, or null when
 * the caller is under the limit.
 */
export async function enforceRateLimit(
  req: NextRequest,
  name: string,
  opts: { limit: number; windowMs: number },
) {
  const verdict = await rateLimit(name, clientKey(req), opts);
  if (verdict.ok) return null;

  return NextResponse.json(
    { error: "Too many attempts. Try again shortly." },
    { status: 429, headers: { "Retry-After": String(verdict.retryAfter) } },
  );
}

/** Shared budgets, so the numbers live in one place. */
export const LIMITS = {
  /** Enumeration probe — cheap to send, so keep it tight. */
  checkUser: { limit: 10, windowMs: 60_000 },
  /** Account creation. */
  signUp: { limit: 5, windowMs: 60 * 60_000 },
  /** Password set / reset on an existing account. */
  createPassword: { limit: 5, windowMs: 15 * 60_000 },
  /** Redeeming an invite link. */
  joinInvite: { limit: 10, windowMs: 60 * 60_000 },
  /** Credential sign-in attempts. */
  signIn: { limit: 10, windowMs: 15 * 60_000 },
} as const;
