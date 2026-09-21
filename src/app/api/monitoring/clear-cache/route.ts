import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';
import { clearRateLimitCache } from '@/lib/rateLimit';

export async function POST() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 });
  }

  const cleared = clearRateLimitCache();
  // Node.js'ga imkon bo'lsa garbage collectionni "so'rash" (--expose-gc bilan ishga tushirilganda ishlaydi)
  const gc = (global as unknown as { gc?: () => void }).gc;
  if (typeof gc === 'function') {
    try { gc(); } catch {}
  }

  return NextResponse.json({ ok: true, clearedEntries: cleared });
}
