/**
 * Oddiy, xotirada saqlanadigan rate limiter.
 *
 * MUHIM CHEKLOV: Vercel serverless funksiyalari statsiz bo'lgani uchun bu
 * xotira faqat bitta "issiq" funksiya nusxasi doirasida ishlaydi — ko'p
 * nusxali (scale-out) muhitda mukammal himoya bermaydi. Production uchun
 * Vercel KV yoki Upstash Redis asosidagi rate limiterga o'tish tavsiya
 * etiladi (README.md'da ko'rsatilgan). Shu bilan birga bu qatlam allaqachon
 * oddiy avtomatlashtirilgan brute-force hujumlarining katta qismini to'xtatadi
 * va monitoring panelidagi "kesh" sifatida ham namoyish etiladi.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Monitoring panelidagi "Keshni tozalash" tugmasi shu funksiyani chaqiradi. */
export function clearRateLimitCache(): number {
  const size = buckets.size;
  buckets.clear();
  return size;
}

export function rateLimitCacheSize(): number {
  return buckets.size;
}
