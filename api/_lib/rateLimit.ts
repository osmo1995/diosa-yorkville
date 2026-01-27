type RateLimitOk = { ok: true };
type RateLimitBlocked = { ok: false; retryAfterSec: number };

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 0); // 0 = disabled

// Best-effort in-memory rate limiter (per instance). Not a hard security boundary.
const store: Map<string, { count: number; resetAt: number }> = new Map();

export function getClientIp(req: any): string {
  const xff = (req?.headers?.['x-forwarded-for'] as string | undefined) || undefined;
  const ip = xff?.split(',')?.[0]?.trim();
  return ip || req?.socket?.remoteAddress || 'unknown';
}

export function checkRateLimit(req: any): RateLimitOk | RateLimitBlocked {
  if (!RATE_LIMIT_MAX || RATE_LIMIT_MAX <= 0) return { ok: true };

  const key = getClientIp(req);
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }

  if (current.count >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }

  current.count += 1;
  return { ok: true };
}
