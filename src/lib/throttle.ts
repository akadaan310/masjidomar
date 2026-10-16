// In-process sliding-window throttle for unauthenticated endpoints (login, signup, reset).
// Complements Supabase Auth's own server-side rate limits. Per instance; documented in
// docs/SECURITY_AND_RLS.md (use a shared store such as Redis if running several instances).
const buckets = new Map<string, number[]>();

export function throttle(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}

export function clearThrottle(key: string) {
  buckets.delete(key);
}
